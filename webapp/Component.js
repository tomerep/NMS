sap.ui.define([
	"com/axians/itsolutions/ui5/nmsmp/libraries/core/NMSMPComponent",
	"sap/ui/core/util/MockServer",
	"sap/ui/Device",
	"sap/ui/model/json/JSONModel",
	"sap/m/App",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"com/sap/build/axians/novofermMobil/model/models",
	"com/sap/build/axians/novofermMobil/utils/Const",
	"com/sap/build/axians/novofermMobil/utils/helper/CoreServiceHelper",
	"com/sap/build/axians/novofermMobil/utils/helper/EquipmentServiceHelper",
	"com/sap/build/axians/novofermMobil/utils/helper/OfflineDatabaseHelper",
	"com/sap/build/axians/novofermMobil/utils/helper/AuthenticationHelper"
	//,"./model/errorHandling"
], function(UIComponent, MockServer, Device, JSONModel, App, MessageToast, MessageBox, models, Const,
	CoreServiceHelper, EquipmentServiceHelper, OfflineDatabaseHelper, AuthenticationHelper /*, errorHandling*/ ) {
	"use strict";

	var navigationWithContext = {};

	return UIComponent.extend("com.sap.build.axians.novofermMobil.Component", {

		metadata: {
			manifest: "json"
		},

		_oCoreServiceHelper: undefined,
		_oEquipmentServiceHelper: undefined,
		_oOfflineDatabaseHelper: undefined,
		_oAuthenticationHelper: undefined,
		_storageUtil: undefined,

		onInitComponentModels: function() {
			if (Window.cordova !== undefined) {
				var oManifestModels = this._getManifestEntry("/sap.ui5/models", true) || {};
				//Rewrite manifest data sources for serviceUrl from offline registrationContext.
				var oManifestDataSources = this._getManifestEntry("/sap.app/dataSources", true) || {};
				var sProfile = this._getManifestEntry("_buildProfile", true);
				var sApplicationEndpointURL = this._getManifestEntry("sap.mobile", true).logon.mainService[sProfile].serverHost;
				if (sApplicationEndpointURL && oManifestDataSources) {
					for (var sModelId in oManifestDataSources) {
						if (oManifestDataSources.hasOwnProperty(sModelId)) {
							var oDataSource = oManifestDataSources[sModelId];
							if (oDataSource.type === "OData") {
								switch (sModelId) {
									case "mainService":
										oDataSource.uri = sApplicationEndpointURL + oDataSource.uri;
										break;
									default:
										break;
								}
							}
						}
					}
				}

				// pass the models and data sources to the internal helper
				this._initComponentModels(oManifestModels, oManifestDataSources);
			} else {
				UIComponent.prototype.onInitComponentModels.apply(this, arguments);
			}
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// tell user, if anonymous service is not reacheable
			this.getModel("anonymous").attachMetadataFailed(function(oEvent) {
				MessageBox.error(this.translate("service.anonymous.unavailable"));
			}.bind(this));

			var bRunWithMock = false;
			var sRunWithMock = jQuery.sap.getUriParameters().get('responderOn');
			if (sRunWithMock === 'true') {
				bRunWithMock = true;
			}
			if (bRunWithMock) {
				jQuery.sap.require('sap.ui.core.util.MockServer');
				var uri = 'localService/metadata.xml/';
				var oMock = new MockServer({
					rootUri: uri
				});
				var _sAppModulePath = "com/sap/build/axians/novofermMobil/";
				var sMetadataPath = "localService/metadata.xml";
				var sMetadataUrl = jQuery.sap.getModulePath(_sAppModulePath + sMetadataPath.replace(".xml", ""), ".xml");
				var sMockdataBaseUrlPath = sMetadataUrl.replace(/[^/]+$/, 'mockdata');
				oMock.simulate(sMetadataUrl, {
					sMockdataBaseUrl: sMockdataBaseUrlPath,
					bGenerateMissingMockData: true
				});
				oMock.start();
				jQuery(document).ready(function($) {
					MessageToast.show('Running in demo mode with mock data.', {
						duration: 4000
					});
				});
			}

			// initialize service-helper
			this._oCoreServiceHelper = new CoreServiceHelper(this);
			this._oEquipmentServiceHelper = new EquipmentServiceHelper(this);
			this._oOfflineDatabaseHelper = new OfflineDatabaseHelper(this);
			this._oAuthenticationHelper = new AuthenticationHelper(this);

			// set app configuration model
			this.setModel(models.createAppConfModel(), Const.models.APP_CONF);
			// set permissions model
			this._oAuthenticationHelper.resetPermissions();
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			// set the FLP model
			this.setModel(models.createFLPModel(), "FLP");
			// set the dataSource model
			// this.setModel(new JSONModel({}), "dataSource");
			// setup equipment models
			this.setModel(models.createEquipmentDetailsModel(), Const.models.EQUIPMENT_DETAILS);
			this.setModel(models.createEquipmentListModel(), Const.models.EQUIPMENT_LIST);
			// model for ok-cancel-dialogs
			this.setModel(models.createOkCancelDlgDataModel(), Const.models.OK_CANCEL_DLG_DATA);

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// Update the online status 
			window.addEventListener('online', this._updateIsAppOnlineFlag.bind(this));
			window.addEventListener('offline', this._updateIsAppOnlineFlag.bind(this));
			this.getModel(Const.models.APP_CONF).setProperty("/isAppOnline", navigator.onLine);

			// delegate error handling
			//errorHandling.register(this);

			this._initAnonymousModel();

			// create the views based on the url/hash
			this.getRouter().initialize();
		},

		getEquipmentsScannedOffline: function() {
			var oEquiScannedOffline = {};
			if (window.localStorage) {
				var sEquiScannedOffline = window.localStorage.getItem(Const.localStorage.EQUI_SCANNED_OFFLINE);
				if (sEquiScannedOffline) {
					try {
						oEquiScannedOffline = JSON.parse(sEquiScannedOffline);
					} catch (oException) {
						// stored string is invalid -> clear storage entry
						this.setEquipmentsScannedOffline([]);
						this.logTrace(oException);
					}
				}
			} else {
				this.logError("Component.getEquipmentsScannedOffline: no local storage available!");
			}
			return oEquiScannedOffline;
		},

		setEquipmentsScannedOffline: function(oEquiScannedOffline) {
			if (window.localStorage) {
				var sEquiScannedOffline = JSON.stringify(oEquiScannedOffline);
				window.localStorage.setItem(Const.localStorage.EQUI_SCANNED_OFFLINE, sEquiScannedOffline);
			} else {
				this.logError("Component.setEquipmentsScannedOffline: no local storage available!");
			}
		},

		getOfflineDBSuffix: function() {
			var sSuffix = Const.offline_database.nameSuffices.A;
			if (window.localStorage) {
				sSuffix = window.localStorage.getItem(Const.localStorage.OFFLINE_DB_SUFFIX);
				if (!sSuffix) {
					window.localStorage.setItem(Const.localStorage.OFFLINE_DB_SUFFIX, Const.offline_database.nameSuffices.A);
				}
			} else {
				this.logError("Component.getOfflineDBSuffix: no local storage available!");
			}
			return sSuffix;
		},

		toggleOfflineDBSuffix: function() {
			var sSuffix = this.getOfflineDBSuffix();
			// toggle only, when state can be stored in localStorage
			if (window.localStorage) {
				switch (sSuffix) {
					case Const.offline_database.nameSuffices.A:
						sSuffix = Const.offline_database.nameSuffices.B
						break;
					case Const.offline_database.nameSuffices.B:
						sSuffix = Const.offline_database.nameSuffices.A
						break;
				}
				window.localStorage.setItem(Const.localStorage.OFFLINE_DB_SUFFIX, sSuffix);
			}
			return sSuffix;
		},

		clearUnusedDB: function() {
			return new Promise(function(fResolve, fReject) {
				var sSuffix = this.getOfflineDBSuffix();
				var sSuffixToClear;
				switch (sSuffix) {
					case Const.offline_database.nameSuffices.A:
						sSuffixToClear = Const.offline_database.nameSuffices.B;
						break;
					case Const.offline_database.nameSuffices.B:
						sSuffixToClear = Const.offline_database.nameSuffices.A;
						break;
					default:
						fReject("Component.clearUnusedDB: unable to clear database due to unknown db-name-suffix: " + sSuffix);
						break;
				}
				this.getOfflineDatabaseHelper().clearAllObjectStores(sSuffixToClear).then(function() {
					fResolve();
				}.bind(this), function(reason) {
					fReject(reason);
				}.bind(this));
			}.bind(this));
		},

		createContent: function() {
			var app = new App({
				id: "App"
			});
			var appType = "App";
			var appBackgroundColor = "#FFFFFF";
			if (appType === "App" && appBackgroundColor) {
				app.setBackgroundColor(appBackgroundColor);
			}

			return app;
		},

		getNavigationPropertyForNavigationWithContext: function(sEntityNameSet, targetPageName) {
			var entityNavigations = navigationWithContext[sEntityNameSet];
			return entityNavigations == null ? null : entityNavigations[targetPageName];
		},

		/*
				doSync: function() {
					return new Promise(function(fResolve, fReject) {
						if (this.isAppOnline()) {
							// read order-positions
							this.logInfo("Component.doSync: start reading CustomerOrder");
							this.getModel().read("/CustomerOrder", {
								urlParameters: {
									"$expand": "OrderPositionSet/EquipmentSet/EquipmentOrderPosition/OrderPositionConfirmationSet"
								},
								success: function(oData) {
									this.logInfo("Component.doSync: reading CustomerOrder successful");
									var oModel = new JSONModel(oData);
									this.setModel(oModel, Const.models.ORDER_LIST);
									this._oOfflineDatabaseHelper.clearObjectStore(Const.offline_database.object_store_names.CUSTOMER_ORDERS).then(function() {
										this._oOfflineDatabaseHelper.addEntries(Const.offline_database.object_store_names.CUSTOMER_ORDERS, oData.results).then(
											function() {
												fResolve();
											}.bind(this),
											function(reason) {
												fReject(reason);
											}.bind(this));
									}.bind(this), function(reason1) {
										fReject(reason1);
									}.bind(this));
								}.bind(this),
								error: function(oError) {
									fReject(oError);
								}.bind(this)
							});
						} else {
							fReject(this.translate("sync.msg.app.offline"));
						}
					}.bind(this)).catch(this.handleError.bind(this));
				},
				//*/
		/*
				doLogOn: function() {
					this.logInfo("Component.doLogOn: start log on");
					return new Promise(function(fResolve, fReject) {
						this._oCoreServiceHelper.getODataModel(false).then(function(oODataModel) {
							this.setModel(oODataModel);
							this.logInfo("Component.doLogOn: log on successful");
							this.logInfo("Component.doLogOn: start updating permissions");
							this._oAuthenticationHelper.updatePermissions().then(function() {
								this.logInfo("Component.doLogOn: updating permissionssuccessful");
								this.logInfo("Component.doLogOn: start opening database");
								// prepare resp. open offline database
								this._oOfflineDatabaseHelper.openDB().then(function() {
									this.logInfo("Component.doLogOn: opening database successful");
									this.getModel(Const.models.APP_CONF).setProperty("/isAuthenticated", true);
									// this.initStorageTools();
									fResolve();
								}.bind(this), function(reason3) {
									this.logError("Component.doLogOn: Error: " + reason3);
									this.logInfo("Component.doLogOn: resetting permissions");
									this._oAuthenticationHelper.resetPermissions();
									fReject(reason3);
								}.bind(this));
							}.bind(this), function(reason2) {
								this.logError("Component.doLogOn: Error: " + reason2);
								this.logInfo("Component.doLogOn: resetting permissions");
								this._oAuthenticationHelper.resetPermissions();
								fReject(reason2);
							}.bind(this));
						}.bind(this), function(reason1) {
							this.logError("Component.doLogOn: Error: " + reason1);
							this.logInfo("Component.doLogOn: resetting permissions");
							this._oAuthenticationHelper.resetPermissions();
							this.getModel(Const.models.APP_CONF).setProperty("/isAuthenticated", false);
							fReject(reason1);
						}.bind(this));
					}.bind(this)).catch(this.handleError.bind(this));
				},

				doLogOff: function() {
					this.logInfo("Component.doLogOff: start log off");
					return new Promise(function(fResolve, fReject) {
						this._oOfflineDatabaseHelper.clearObjectStore(Const.offline_database.object_store_names.CUSTOMER_ORDERS).then(function() {
							this._oOfflineDatabaseHelper.clearObjectStore(Const.offline_database.object_store_names.ORDERPOS_CONFIRMATIONS).then(function() {
								this.setModel(undefined);
								this.getModel(Const.models.APP_CONF).setProperty("/isAuthenticated", false);
								this.logInfo("Component.doLogOff: log off successful");
								this.logInfo("Component.doLogOff: closing database");
								this._oOfflineDatabaseHelper.closeDB();
								this.logInfo("Component.doLogOff: resetting permissions");
								this._oAuthenticationHelper.resetPermissions();
								fResolve();
							}.bind(this), function(reason1) {
								this.logError(reason1);
								fReject(reason1);
							}.bind(this));
						}.bind(this), function(reason) {
							this.logError(reason);
							fReject(reason);
						}.bind(this));
					}.bind(this)).catch(this.handleError.bind(this));
				},
		//*/
		_initAnonymousModel: function() {
			this.logInfo("Component._initAnonymousModel: starting");
			return new Promise(function(fResolve, fReject) {
				this.logInfo("Component._initAnonymousModel: start reading 'BackendCode' from model");
				var oODataModel = this.getModel("anonymous");
				oODataModel.read("/BackendCode", {
					success: function(oResult) {
						this.setModel(new JSONModel(oResult.results), Const.models.BACKENDCODE_MODEL);
						this.logInfo("Component._initAnonymousModel: start reading 'Language' from model: " + JSON.stringify(oResult.results));
						oODataModel.read("/Language", {
							success: function() {
								this.logInfo("Component._initAnonymousModel: init and reading successful");
								fResolve();
							}.bind(this),
							error: function(oError) {
								this.logInfo("JAMA: ", JSON.stringify(oError));
								this.logTrace(oError);
								fReject(oError);
							}.bind(this)
						});
					}.bind(this),
					error: function(oError) {
						this.logTrace(oError);
						this.logInfo("JAMA1: ", JSON.stringify(oError));
						fReject(oError);
					}.bind(this)
				});
			}.bind(this)).catch(this.handleError.bind(this));
		},
		/**
		 * Prepare and create storage utils.
		 * @memberOf com.sap.build.axians.novofermMobil.Component
		 */
		/*
				initStorageTools: function() {
					try {
						this.logInfo("Component.initStorageTools: starting storage tool initialization. ========");
						var sStorageId = this.getManifestEntry("/sap.app/storageUtils/storageId");
						var oModel = this.getModel();
						this.setStorageUtil(new StorageUtil(oModel, oModel.sServiceUrl, sStorageId));
						this.logInfo("Component.initStorageTools: ======== finished storage tool initialization. ");
					} catch (oError) {
						this.logTrace(oError);
					}
				},

				deleteStorage: function() {
					return new Promise(function(fResolve, fReject) {
						this.logInfo("Component.deleteStorage: starting storage tool deletion. ========");
						var sStorageId = this.getManifestEntry("/sap.app/storageUtils/storageId");
						new Storage().removeItem(sStorageId).then(function() {
							this.logInfo("Component.deleteStorage: successful deleted local storage data. ========");
							this.setStorageUtil(null);
							this.logInfo("Component.deleteStorage: successful deleted storage tool. ========");
							fResolve();
						}.bind(this), function(reason) {
							this.logError("Component.deleteStorage: delete local storage data failed. ========");
							fReject(reason);
						}.bind(this));
					}.bind(this)).catch(this.handleError.bind(this));
				},
		//*/
		getCoreServiceHelper: function() {
			return this._oCoreServiceHelper;
		},

		getEquipmentServiceHelper: function() {
			return this._oEquipmentServiceHelper;
		},

		getOfflineDatabaseHelper: function() {
			return this._oOfflineDatabaseHelper;
		},

		lockSubmitData: function() {
			this.getModel(Const.models.APP_CONF).setProperty("/isSubmitLocked", true);
		},

		unlockSubmitData: function() {
			setTimeout(function() {
				this.getModel(Const.models.APP_CONF).setProperty("/isSubmitLocked", false);
			}.bind(this), 2000);
		},

		isSubmitDataLocked: function() {
			return this.getModel(Const.models.APP_CONF).getProperty("/isSubmitLocked");
		},

		_updateIsAppOnlineFlag: function(oEvent) {
			// TODO use cordova-plugin-network-information, navigator.connection.type
			if (oEvent.type === "offline") {
				this.logWarn("Component._updateIsAppOnlineFlag: lost internet connection!");
				this.getModel(Const.models.APP_CONF).setProperty("/isAppOnline", false);

			} else if (oEvent.type === "online") {
				this.logInfo("Component._updateIsAppOnlineFlag: internet connection OK!");
				this.getModel(Const.models.APP_CONF).setProperty("/isAppOnline", true);
			}
		},

		getConnectiontype: function() {
			if (window.cordova) {
				var networkState = navigator.connection.type;

				var states = {};
				states[Connection.UNKNOWN] = 'Unknown connection';
				states[Connection.ETHERNET] = 'Ethernet connection';
				states[Connection.WIFI] = 'WiFi connection';
				states[Connection.CELL_2G] = 'Cell 2G connection';
				states[Connection.CELL_3G] = 'Cell 3G connection';
				states[Connection.CELL_4G] = 'Cell 4G connection';
				states[Connection.CELL] = 'Cell generic connection';
				states[Connection.NONE] = 'No network connection';

				return states[networkState];
			}
			return undefined;
		},

		/**
		 * Stores flag indicating, that user has local data not yet send to BE
		 * @param {Boolean} bHasLocalChanges optional: if omitted, defaults to true
		 */
		setHasLocalChanges: function(bHasLocalChanges) {
			bHasLocalChanges = bHasLocalChanges === undefined ? true : bHasLocalChanges;
			this.getModel(Const.models.APP_CONF).setProperty("/hasLocalChanges", bHasLocalChanges);
		},
		/**
		 * @returns {Boolean} flag indicating, if user has local data not yet send to BE
		 */
		hasLocalChanges: function() {
			return this.getModel(Const.models.APP_CONF).getProperty("/hasLocalChanges");
		},

		isAppOnline: function() {
			return this.getModel(Const.models.APP_CONF).getProperty("/isAppOnline");
		},

		/**
		 * Log error as trace and display error message as MessageBox if message is provided.
		 * @param {any} vError Error container.
		 * @param {string} vError.message (optional) if passed, this message will be displayed.
		 *
		 * @function handleError
		 * @since 0.1.21
		 * @public
		 */
		handleError: function(vError) {
			if (vError !== undefined) {
				this.logTrace(vError);
				if (vError.message) {
					MessageBox.error(vError.message);
				}
			}
		}

	});

});