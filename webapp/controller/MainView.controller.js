sap.ui.define([
	"com/sap/build/axians/novofermMobil/controller/BaseController",
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/m/Button",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/Dialog"
], function(BaseController, UIComponent, JSONModel, Button, MessageBox, MessageToast, Filter, FilterOperator, Dialog) {
	"use strict";

	return BaseController.extend("com.sap.build.axians.novofermMobil.controller.MainView", {

		_targetOrigin: undefined,
		// reference to window/document of online-app; initialized in MainView._receiveMessageFromOnlineApp while processing command /utils/Const.messageTypes.ONLINE_APP_LOADED
		_onlineAppWindow: undefined,
		// parameters passed to callback handling 'afterOpen' event of OnlineApp dialog
		_openOnlineAppEventData: {},
		_successCallback: undefined,
		_errorCallback: undefined,
		// names of available barcode types, initialized in MainView._getCodeFormatNames
		_sCodeFormatNames: undefined,
		_oSelectedEquiListItem: undefined,

		_oEnterSerialNumDialog: null,
		_sEnterSerialNumDialog: "com.sap.build.axians.novofermMobil.view.fragments.equipment.EnterSerialNumberDialog",
		_sEnterSerialNumDialogId: "enterSerialNumDialogId",

		_oSelectEquiDialog: null,
		_sSelectEquiDialog: "com.sap.build.axians.novofermMobil.view.fragments.equipment.SelectEquipmentDialog",
		_sSelectEquiDialogId: "selectEquiDialogId",

		_oCancelConfirmationDialog: null,
		_sCancelConfirmationDialog: "com.sap.build.axians.novofermMobil.view.fragments.ConfirmCancelConfirmationDialog",
		_sCancelConfirmationDialogId: "cancelConfirmationDialogId",

		_oEquiConfigPopover: null,
		_sEquiConfigPopover: "com.sap.build.axians.novofermMobil.view.fragments.equipment.EquiConfigPopover",
		_sEquiConfigPopoverId: "equiConfigPopoverId",

		_oOkCancelDialog: null,
		_sOkCancelDialog: "com.sap.build.axians.novofermMobil.view.fragments.OkCancelDialog",
		_sOkCancelDialogId: "okCancelDialogId",

		_oConfigurationHtmlDialog: null,
		_sConfigurationHtmlDialog: "com.sap.build.axians.novofermMobil.view.fragments.equipment.ConfigurationHtml",
		_sConfigurationHtmlDialogId: "configurationHtmlDialogId",

		_oOnlineAppContainer: null,
		_sOnlineAppContainer: "com.sap.build.axians.novofermMobil.view.fragments.OnlineApp",
		_sOnlineAppContainerId: "onlineAppContainerId",

		_oMenuPopover: null,
		_sMenuPopover: "com.sap.build.axians.novofermMobil.view.fragments.MenuPopover",
		_sMenuPopoverId: "menuPopoverId",

		_oAboutDialog: null,
		_sAboutDialog: "com.sap.build.axians.novofermMobil.view.fragments.AboutDialog",
		_sAboutDialogId: "aboutDialogId",

		/* ========================================================================================================== */
		/* Lifecycle methods
		/* ========================================================================================================== */

		onInit: function() {
			this.oRouter = UIComponent.getRouterFor(this);
			this.oRouter.getRoute("MainView").attachPatternMatched(this._handleEnterRoute.bind(this), this);

			this._oEnterSerialNumDialog = sap.ui.xmlfragment(this._sEnterSerialNumDialogId, this._sEnterSerialNumDialog, this);
			this.getView().addDependent(this._oEnterSerialNumDialog);
			this._oCancelConfirmationDialog = sap.ui.xmlfragment(this._sCancelConfirmationDialogId, this._sCancelConfirmationDialog, this);
			this.getView().addDependent(this._oCancelConfirmationDialog);
			this._oEquiConfigPopover = sap.ui.xmlfragment(this._sEquiConfigPopoverId, this._sEquiConfigPopover, this);
			this.getView().addDependent(this._oEquiConfigPopover);
			this._oSelectEquiDialog = sap.ui.xmlfragment(this._sSelectEquiDialogId, this._sSelectEquiDialog, this);
			this.getView().addDependent(this._oSelectEquiDialog);
			this._oOnlineAppContainer = sap.ui.xmlfragment(this._sOnlineAppContainerId, this._sOnlineAppContainer, this);
			this.getView().addDependent(this._oOnlineAppContainer);
			// we want to be notified, when online-app opnened
			this._oOnlineAppContainer.attachAfterOpen(this._openOnlineAppEventData, this._handleOnlineAppDialogOpened.bind(this), this);

			this._targetOrigin = window.origin; // TODO use correct targetOrigin
			window.addEventListener("message", this._receiveMessageFromOnlineApp.bind(this), false);
		},

		/* ========================================================================================================== */
		// Functions
		/* ========================================================================================================== */

		scanCode: function() {
			return new Promise(function(fResolve, fReject) {
				if (window.cordova && window.cordova.plugins.barcodeScanner) {
					window.cordova.plugins.barcodeScanner.scan(
						function(result) {
							fResolve(result);
						}.bind(this),
						function(error) {
							fReject(error);
						}.bind(this), {
							preferFrontCamera: true, // iOS and Android
							showFlipCameraButton: true, // iOS and Android
							showTorchButton: true, // iOS and Android
							torchOn: true, // Android, launch with the torch switched on (if available)
							saveHistory: true, // Android, save scan history (default false)
							prompt: this.translate("scan.msg.info.placeInScanArea"), // Android
							resultDisplayDuration: 500, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
							formats: this._getCodeFormatNames(), // default: all but PDF_417 and RSS_EXPANDED
							orientation: "portrait", // Android only (portrait|landscape), default unset so it rotates with the device
							disableAnimations: true, // iOS
							disableSuccessBeep: false // iOS and Android
						}
					);
				} else {
					fReject(this.translate("scan.msg.error.unavailable"));
				}
			}.bind(this)).catch(this.handleError.bind(this));
		},

		handleCancelConfirmationPress: function(oEvent) {
			if (this.getAppConfModel().getProperty("/hasLocalChanges")) {
				// ask user to confirm cancellation
				var oConfDlg = this._getOkCancelDialog(this.translate("label.cancel"), this.translate("quest.cancel.discard.changes"),
					function() {
						// drop all local confirmations
						this._discardLocalConfirmations();
						// invalidate equipment view
						this.getView().getModel(this.constants.models.EQUIPMENT_DETAILS).setProperty("/isValid", false);
						oConfDlg.close();
					}.bind(this),
					function() {
						oConfDlg.close();
					}.bind(this));
				oConfDlg.open();
			} else {
				// no changes -> leave equi view
				this.getView().getModel(this.constants.models.EQUIPMENT_DETAILS).setProperty("/isValid", false);
			}
		},

		openAboutDialog: function(oEvent) {
			var oAboutDialog = this._getAboutDialog();
			var aPromises = [this.getCoreServiceHelper().getBuildProfile(), this.getCoreServiceHelper().getBuildDate(), this.getCoreServiceHelper()
				.getBuildCommit()
			];
			Promise.all(aPromises).then(function(aResults) {
				this.getView().setModel(new JSONModel({
					"buildProfile": aResults[0],
					"buildTime": aResults[1],
					"commit": aResults[2]
				}), "AboutModel");
			}.bind(this));
			oAboutDialog.open();
		},

		pressCloseAboutDialog: function(oEvent) {
			this._getAboutDialog().close();
		},

		_getAboutDialog: function() {
			if (!this._oAboutDialog) {
				this._oAboutDialog = sap.ui.xmlfragment(this._sAboutDialogId, this._sAboutDialog, this);
				this.getView().addDependent(this._oAboutDialog);
			}
			return this._oAboutDialog;
		},

		isConfirmationConfirmed: function(oOrderPosConfirmationSet) {
			var bSelected = false;
			if (oOrderPosConfirmationSet && Array.isArray(oOrderPosConfirmationSet.results)) {
				if (oOrderPosConfirmationSet.results.length > 0)
					if (!oOrderPosConfirmationSet.results[0].IsStorno) {
						bSelected = true;
					}
			}
			return bSelected;
		},

		/* ========================================================================================================== */
		// Private Functions
		/* ========================================================================================================== */

		_discardLocalConfirmations: function() {
			this.getView().getModel(this.constants.models.SAVE_CONFIRMATION_MODEL).setProperty("/elements", []);
			this.getOfflineDatabaseHelper().clearObjectStore(this.constants.offline_database.object_store_names.ORDERPOS_CONFIRMATIONS);
			this.getAppConfModel().setProperty("/hasLocalChanges", false);
		},

		/**
		 * Collects names of scannable codes
		 */
		_getCodeFormatNames: function() {
			if (!this._sCodeFormatNames) {
				var oAnonymousModel = this.getComponentModel(this.constants.models.BACKENDCODE_MODEL);
				var oData = oAnonymousModel.getProperty("/");
				// collect backend-codes as keys, because codes may have duplicates due to different 'BackendFk'
				var oCodes = {};
				for (var key in oData) {
					var oBackendCode = oData[key];
					oCodes[oBackendCode.TypeOfId] = true;
				}
				var aCodeFormatNames = Object.keys(oCodes);
				this._sCodeFormatNames = aCodeFormatNames.join(",");
			}
			return this._sCodeFormatNames;
		},

		/**
		 * Returns a sap.m.dialog with title, text, ok and cancel buttons
		 * @param sTitle title to display
		 * @param sText text to display
		 * @param fConfirm callback for press on ok button
		 * @param fDecline callback for press on cancel button
		 * @returns {sap.m.Dialog}
		 * @private
		 */
		_getOkCancelDialog: function(sTitle, sText, fConfirm, fDecline) {
			if (!this._oOkCancelDialog) {
				this._oOkCancelDialog = sap.ui.xmlfragment(this._sOkCancelDialogId, this._sOkCancelDialog, this);
				this.getView().addDependent(this._oOkCancelDialog);
			}
			var oOkCancelDlgModel = this.getComponentModel(this.constants.models.OK_CANCEL_DLG_DATA);
			oOkCancelDlgModel.setProperty("/title", sTitle);
			oOkCancelDlgModel.setProperty("/text", sText);
			this._oOkCancelDialog.setBeginButton(new Button({
				text: this.translate("label.ok"),
				press: fConfirm
			}));
			this._oOkCancelDialog.setEndButton(new Button({
				text: this.translate("label.cancel"),
				press: fDecline
			}));
			return this._oOkCancelDialog;
		},

		_getMenuPopover: function() {
			if (!this._oMenuPopover) {
				this._oMenuPopover = sap.ui.xmlfragment(this._sMenuPopoverId, this._sMenuPopover, this);
				this.getView().addDependent(this._oMenuPopover);
			}
			return this._oMenuPopover;
		},

		openMenu: function(oEvent) {
			if (this._getMenuPopover().isOpen()) {
				this._getMenuPopover().close();
			} else {
				this._getMenuPopover().openBy(oEvent.getSource());
			}
		},

		_getConfigurationHtmlDialog: function() {
			if (!this._oConfigurationHtmlDialog) {
				this._oConfigurationHtmlDialog = sap.ui.xmlfragment(this._sConfigurationHtmlDialogId, this._sConfigurationHtmlDialog, this);
				this.getView().addDependent(this._oConfigurationHtmlDialog);
			}
			return this._oConfigurationHtmlDialog;
		},

		_handleEnterRoute: function(oEvent) {},

		_findBackendCodesByQRCodeType: function(oFormat) {
			return new Promise(function(fnSuccess, funError) {
				var aBackendCodes = this.getView().getModel(this.constants.models.BACKENDCODE_MODEL).getProperty("/");

				var aFilteredBackendCodes = [];

				aBackendCodes.forEach(function(oElement) {
					if (oFormat === oElement.TypeOfId) {
						aFilteredBackendCodes.push(oElement);
					}
				}.bind(this));

				if (aFilteredBackendCodes.length > 0) {
					fnSuccess(aFilteredBackendCodes);
				} else {
					funError();
				}
			}.bind(this)).catch(this.handleError.bind(this));
		},

		/**
		 * Extracts equipment number from scanned code
		 * @param {Object} oBackendCode instance of BackendCode
		 * @param {string} sScannedCode scanned code to be analyzed
		 */
		_extractEquipmentNumber: function(oBackendCode, sScannedCode) {
			return new Promise(function(fnSuccess, fnError) {
				var sReducedPrefix = oBackendCode.Prefix !== null ? sScannedCode.substr(oBackendCode.Prefix.length) : sScannedCode;
				var sReducedSuffix = oBackendCode.Suffix !== null ? sReducedPrefix.substr(0, sReducedPrefix.length - oBackendCode.Suffix.length) :
					sReducedPrefix;

				fnSuccess(sReducedSuffix);
			}.bind(this)).catch(this.handleError.bind(this));
		},

		_refreshEquiDetails: function(sEquiNr, sBackendCode) {
			this.logInfo("MainView._refreshEquiDetails: start refreshing equipment details");
			// got chosen one one equi -> get its details
			if (this.getAppConfModel().getProperty("/user/isAuthenticated")) {
				// user logged in
				// search equi in synced data
				this.logInfo("MainView._refreshEquiDetails: search equi in synced data");

				this.getOfflineDatabaseHelper().getEntry(this.constants.offline_database.object_store_names.EQUIPMENTS, {
					Backend: sBackendCode,
					EquipmentId: sEquiNr
				}).then(function(oEquiData) {
					this.logInfo("MainView._refreshEquiDetails: search equi in synced data successful");
					this._updateEquiDetailsModel(oEquiData, sBackendCode);
					this._refreshOrderPosOperationsModel(oEquiData);
				}.bind(this), function(reason) {
					this.logError("MainView._refreshEquiDetails: search equi in synced data failed");
				}.bind(this))

				// read equi data online
				this.logInfo("MainView._refreshEquiDetails: read equi data online");
			} else {
				// user not logged in -> read data from anonymous service
				this.logInfo("MainView._refreshEquiDetails: read equipment details from anonymous service");
				this.getEquipmentServiceHelper().getEquipmentDetails(sEquiNr, sBackendCode).then(function(oEquiData) {
					this.logInfo("MainView._refreshEquiDetails: refreshing equipment details success");
					this._updateEquiDetailsModel(oEquiData, sBackendCode);
				}.bind(this), function(reason) {
					this.logInfo("MainView._refreshEquiDetails: refreshing equipment details failed");
					MessageBox.error(reason);
				}.bind(this));
			}
		},

		_updateEquiDetailsModel: function(oEquiData, sBackendCode) {
			if (oEquiData) {
				oEquiData.Backend = sBackendCode;
			}
			var oEquiDetailsModel = this.getModel(this.constants.models.EQUIPMENT_DETAILS);
			oEquiDetailsModel.setProperty("/data", oEquiData);
			oEquiDetailsModel.setProperty("/isValid", !!oEquiData);
		},

		_determineEquipmentDetails: function(sEquiNr, sBackendCode) {
			if (this.getAppConfModel().getProperty("/isAppOnline")) {
				// we are online
				if (sBackendCode) {
					this.getView().setModel(new JSONModel({
						selectDoor: true
					}), "SELECTDOOR");
					this._refreshEquiDetails(sEquiNr, sBackendCode);
				} else {
					this.getView().setModel(new JSONModel({
						selectDoor: false
					}), "SELECTDOOR");
					// get all equis with given equi-no
					this._getEquiList(sEquiNr).then(function(aEquis) {
						if (Array.isArray(aEquis) && aEquis.length > 0) {
							if (aEquis.length === 1) {
								this._refreshEquiDetails(aEquis[0].EquipmentId, aEquis[0].Backend);
							} else {
								this.getView().setModel(new JSONModel({
									selectDoor: true
								}), "SELECTDOOR");
								// got more than one equi -> let user select one
								var oEquiListModel = this.getComponentModel(this.constants.models.EQUIPMENT_LIST);
								oEquiListModel.setProperty("/results", aEquis);
								oEquiListModel.setProperty("/hasSelection", false);
								this._oSelectEquiDialog.open();
							}
						} else {
							MessageBox.warning(this.translate("equi.msg.equinum.notFound"));
						}
					}.bind(this), function(error) {
						MessageBox.error(this.translate("equi.msg.error.read.from.service"));
						this.logTrace(error);
					}.bind(this));
				}
			} else {
				// we are offline -> store equi no
				var oEquiScannedOffline = this.getEquipmentsScannedOffline();
				oEquiScannedOffline[sEquiNr] = {
					Backend: sBackendCode || ""
				};
				this.setEquipmentsScannedOffline(oEquiScannedOffline);
				MessageBox.information(this.translate("equi.msg.scan.offline"));
			}
		},

		_getEquiList: function(sEquiNr) {
			return new Promise(function(fnResolve, fnReject) {
				if (this.getAppConfModel().getProperty("/user/isAuthenticated")) {
					// user logged on -> get equis from synced data
					this.logInfo("MainView._getEquiList: start read equipments from synced data");
					this.getOfflineDatabaseHelper().getEntries(this.constants.offline_database.object_store_names.EQUIPMENTS).then(function(aEquis) {
						this.logInfo("MainView._getEquiList: read equipments from synced data success");
						// filter equis
						if (sEquiNr) {
							aEquis = aEquis.filter(function(oEqui) {
								return oEqui.EquipmentId === sEquiNr;
							});
						}
						if (aEquis.length > 0) {
							fnResolve(aEquis);
						} else {
							// no equis match in synced data -> try to read online
							this._openOnlineAppEventData.msgType = this.constants.messageTypes.EQUI_DATA;
							this._openOnlineAppEventData.equipmentId = sEquiNr;
							// remember callback to be able to finish the promise
							this._successCallback = fnResolve;
							this._errorCallback = fnReject;
							this._openOnlineApp();
						}
					}.bind(this), function(reason) {
						this.logTrace(error, fnReject);
					}.bind(this));
				} else {
					// user not logged on -> read equis from anonymous service
					this.logInfo("MainView._getEquiList: start read equipments from anonymous");
					this.getEquipmentServiceHelper().getEquipmentList(sEquiNr).then(function(aEquis) {
						this.logInfo("MainView._getEquiList: read equipments from anonymous success");
						fnResolve(aEquis);
					}.bind(this), function(error) {
						this.logTrace(error, fnReject);
					}.bind(this));
				}
			}.bind(this));
		},

		_refreshOrderPosOperationsModel: function(oEquipment) {
			return new Promise(function(fResolve, fReject) {
				if (oEquipment) {
					this.logInfo("MainView._refreshOrderPosOperationsModel: get current equi and its orderid");
					var sEquiId = oEquipment.EquipmentId;
					var sOrderId = oEquipment.OrderId;
					var sBackend = oEquipment.Backend;
					// position-operations model
					var oOrderPosOperationsModel = undefined;
					// currently navigation to 'EquipmentOrderPosition' delivers an array, which is expected to contain only one entry
					if (Array.isArray(oEquipment.EquipmentOrderPosition.results) && oEquipment.EquipmentOrderPosition.results.length > 0) {
						var oOrderPosition = oEquipment.EquipmentOrderPosition.results[0];
						var aOrderPosOperations = [];
						for (var iPosOpIndex in oOrderPosition.OrderPositionOperationSet.results) {
							var oPosOperation = oOrderPosition.OrderPositionOperationSet.results[iPosOpIndex];
							// check if service is allowed to be confirmed/cancelled at all
							if (oPosOperation.ServiceType && oPosOperation.ServiceType.IsConfirmable) {
								// navigation to 'OrderPositionConfirmationSet' delivers an array, which is expected to contain only one entry, because cloud-service always delivers only the latest confirmation, if any
								if (Array.isArray(oPosOperation.OrderPositionConfirmationSet.results) && oPosOperation.OrderPositionConfirmationSet.results
									.length > 0) {
									// for binding convenience:
									oPosOperation.OrderPositionConfirmation = oPosOperation.OrderPositionConfirmationSet.results[0];
								}
								aOrderPosOperations.push(oPosOperation);
							}
						}
						oOrderPosOperationsModel = new JSONModel(aOrderPosOperations);
					} else {
						var sError = "MainView._refreshOrderPosOperationsModel: equipment '" + sEquiId +
							"' (backend '" + sBackend + "') does not contain any order-positions!";
						this.logError(sError);
					}
					// order model
					this.getView().setModel(oOrderPosOperationsModel, this.constants.models.ORDERPOS_OPERATIONS_MODEL);
					this.getOfflineDatabaseHelper().getEntry(this.constants.offline_database.object_store_names.CUSTOMER_ORDERS, {
						Backend: sBackend,
						OrderId: sOrderId
					}).then(function(oOrder) {
						var oOrderModel = undefined;
						if (oOrder) {
							// currently partners contained in a set -> move to property for easy handling in xml view
							var oPartnerBL = {};
							if (Array.isArray(oOrder.OrderBlPartnerSet.results) && oOrder.OrderBlPartnerSet.results.length === 1) {
								oPartnerBL = oOrder.OrderBlPartnerSet.results[0];
							}
							oOrder.OrderBlPartner = oPartnerBL;
							var oPartnerSub = {};
							if (Array.isArray(oOrder.OrderSubPartnerSet.results) && oOrder.OrderSubPartnerSet.results.length === 1) {
								oPartnerSub = oOrder.OrderSubPartnerSet.results[0];
							}
							oOrder.OrderSubPartner = oPartnerSub;
							oOrderModel = new JSONModel(oOrder);
						} else {
							var sError = "MainView._refreshOrderPosOperationsModel: order: orderid '" +
								sOrderId +
								"' (backend: '" +
								sBackend + "') does not exist";
							this.logWarn(sError);
							oOrderModel = new JSONModel({
								noOrder: true
							});
						}
						this.getView().setModel(oOrderModel, this.constants.models.ORDER_MODEL);
						fResolve();
					}.bind(this), function(reason) {
						this.logError(reason);
						this.logError("MainView._refreshOrderPosOperationsModel: error while reading order from synced data: orderid '" +
							sOrderId + "' (backend: '" +
							sBackend + "'))");
						// no order data, but resolve anyway
						fResolve();
					}.bind(this));
				} else {
					var sError = "MainView._refreshOrderPosOperationsModel: was called with equipment undefined";
					this.logError(sError);
					fReject(sError);
				}
			}.bind(this)).catch(this.handleError.bind(this));
		},

		/**
		 * Tries to read an OrderPositionConfirmation from indexDB belonging to given OrderPosOperation
		 * @param {Object} oOrderPosOperation
		 */
		_getOrderPosConfirmationLocal: function(oOrderPosOperation) {
			return new Promise(function(fResolve, fReject) {
				this.logInfo("MainView._getOrderPosConfirmationLocal: start getting order-position-confirmation from indexDB");
				if (oOrderPosOperation) {
					this.getOfflineDatabaseHelper().getEntry(this.constants.offline_database.object_store_names.ORDERPOS_CONFIRMATIONS, {
						Backend: oOrderPosOperation.Backend,
						OrderId: oOrderPosOperation.OrderId,
						OrderPositionNo: oOrderPosOperation.OrderPositionNo,
						OrderPositionOperationNo: oOrderPosOperation.OperationId,
						EquipmentId: this.getView().getModel(this.constants.models.EQUIPMENT_DETAILS).getProperty("/data/EquipmentId")
					}).then(function(oConfirmation) {
						this.logInfo("MainView._getOrderPosConfirmationLocal: getting order-position-confirmation from indexDB successful");
						fResolve(oConfirmation);
					}.bind(this), function(reason) {
						this.logError("MainView._getOrderPosConfirmationLocal: getting order-position-confirmation from indexDB failed");
						fReject(reason);
					}.bind(this))
				} else {
					fResolve(undefined);
				}
			}.bind(this)).catch(this.handleError.bind(this));
		},

		/**
		 * Stores given OrderPositionConfirmation to indexDB
		 * @param {Object} oConfirmation
		 */
		_setOrderPosConfirmationLocal: function(oConfirmation) {
			return new Promise(function(fResolve, fReject) {
				this.logInfo("MainView._setOrderPosConfirmationLocal: start writing order-position-confirmation to indexDB");
				this.getOfflineDatabaseHelper().addEntry(this.constants.offline_database.object_store_names.ORDERPOS_CONFIRMATIONS,
					oConfirmation).then(function(oConfirmation) {
					this.logInfo("MainView._setOrderPosConfirmationLocal: writing order-position-confirmation to indexDB successful");
					fResolve();
				}.bind(this), function(reason) {
					this.logError("MainView._setOrderPosConfirmationLocal: writing order-position-confirmation to indexDB failed");
					fReject(reason);
				}.bind(this))
			}.bind(this)).catch(this.handleError.bind(this));
		},

		/**
		 * Removes given OrderPositionConfirmation from indexDB
		 * @param {Object} oConfirmation
		 */
		_removeOrderPosConfirmationLocal: function(oConfirmation) {
			return new Promise(function(fResolve, fReject) {
				this.logInfo("MainView._removeOrderPosConfirmationLocal: start deleting order-position-confirmation from indexDB");
				this.getOfflineDatabaseHelper().removeEntry(this.constants.offline_database.object_store_names.ORDERPOS_CONFIRMATIONS, {
					Backend: oConfirmation.Backend,
					OrderId: oConfirmation.OrderId,
					OrderPositionNo: oConfirmation.OrderPositionNo,
					OrderPositionOperationNo: oConfirmation.OrderPositionOperationNo,
					EquipmentId: oConfirmation.EquipmentId
				}).then(function() {
					this.logInfo("MainView._removeOrderPosConfirmationLocal: deleting order-position-confirmation from indexDB successful");
					fResolve();
				}.bind(this), function(reason) {
					this.logInfo("MainView._removeOrderPosConfirmationLocal: deleting order-position-confirmation from indexDB failed");
					fReject(reason);
				}.bind(this))
			}.bind(this)).catch(this.handleError.bind(this));
		},

		/**
		 * Creates new OrderPositionConfirmation
		 * @param {Object} oOrderPosOperation OrderPosOperation to which the new confirmation belongs to
		 * @param {string} sEquiID number of concerned equipment
		 * @param {Boolean} bIsStorno indicating, if the new confirmation is a cancellation (Storno)
		 */
		_createOrderPosConfirmation: function(oOrderPosOperation, sEquiID, bIsStorno) {
			/*
			// debug code
			navigator.webkitTemporaryStorage.queryUsageAndQuota(
				function(usedBytes, grantedBytes) {
					console.log('we are using ', usedBytes, ' of ', grantedBytes, 'bytes');
				},
				function(e) {
					console.log('Error', e);
				}
			);
			//*/
			return {
				Backend: oOrderPosOperation.Backend,
				OrderId: oOrderPosOperation.OrderId,
				OrderPositionNo: oOrderPosOperation.OrderPositionNo,
				OrderPositionOperationNo: oOrderPosOperation.OperationId,
				EquipmentId: sEquiID,
				Guid: this.getGuidGenerator().generateGuid().replace(/-/g, ""),
				ConfirmedAt: new Date(),
				IsStorno: bIsStorno ? 1 : 0
			}
		},

		/**
		 * Creates/initializes json model used to determine, which confirmation checkbox is modified resp. in initial state
		 */
		_initConfirmationConfigModel: function() {
			var oSaveConfModel = this.getView().getModel(this.constants.models.SAVE_CONFIRMATION_MODEL);
			if (!oSaveConfModel) {
				oSaveConfModel = new JSONModel({});
				this.getView().setModel(oSaveConfModel, this.constants.models.SAVE_CONFIRMATION_MODEL);
			}
			var aElements = oSaveConfModel.getProperty("/elements");
			if (!aElements) {
				aElements = [];
				oSaveConfModel.setProperty("/elements", aElements);
			}
		},

		_updateConfirmButtonStateModel: function(oControl, bDoDelete) {
			var sId = oControl.getId();
			var oContext = oControl.getBindingContext("orderPosOperationsModel");
			var oOrderPosOperation = oContext.getObject();
			oOrderPosOperation.metaData = oOrderPosOperation.metaData || {};
			oOrderPosOperation.metaData.isChanged = !bDoDelete;
			oContext.getModel().setProperty(oContext.sPath, oOrderPosOperation);
			var oSaveConfModel = this.getModel(this.constants.models.SAVE_CONFIRMATION_MODEL);
			var mElements = oSaveConfModel.getProperty("/elements");
			if (bDoDelete) {
				delete mElements[sId];
			} else {
				mElements[sId] = true;
			}
			oSaveConfModel.setProperty("/elements", mElements);
			this.getModel("appConfModel").setProperty("/hasLocalChanges", Object.keys(mElements).length > 0);
		},

		/**
		 * Processes messages received from online-app
		 * @param {Object} oEvent message event; must at least contain property oEvent.data.msgType according to /utils/Const.messageTypes
		 */
		_receiveMessageFromOnlineApp: function(oEvent) {
			if (oEvent.origin === this._targetOrigin) {
				this.logInfo("MainView._receiveMessageFromOnlineApp: received message " + oEvent.data.msgType);
				if (oEvent.data.msgType) {
					this.logInfo("MainView._receiveMessageFromOnlineApp: received message " + oEvent.data.msgType);
					switch (oEvent.data.msgType) {
						case this.constants.messageTypes.ONLINE_APP_LOADED:
							this._onlineAppWindow = oEvent.source;
							break;
						case this.constants.messageTypes.LOGIN_SUCCESSFUL:
							this.logInfo("MainView._receiveMessageFromOnlineApp: opening database");
							this._handleLogonSuccess();
							break;
						case this.constants.messageTypes.USER_DATA:
							this._storeUserData(oEvent.data);
							break;
						case this.constants.messageTypes.ORDER_DATA:
							this._storeOrderDataToDB(oEvent.data.data);
							break;
						case this.constants.messageTypes.EQUI_DATA:
							this._handleEquipmentReceived(oEvent.data);
							break;
						case this.constants.messageTypes.CONFIRMATION_SEND:
							this._handleConfirmationSend(oEvent.data);
							break;
						case this.constants.messageTypes.PERMISSION_DATA:
							// update permissions in models
							this.getAuthenticationHelper().updatePermissions(oEvent.data.data);
							break;
						case this.constants.messageTypes.OPERATION_FINSHED:
							// online-app finished
							this._finishOperation(oEvent.data);
							break;
						default:
							this.logWarn("MainView._receiveMessageFromOnlineApp: received unknown message " + oEvent.data.msgType);
							break;
					}
				} else {
					this.logError("MainView._receiveMessageFromOnlineApp: received message without 'msgType'");
				}
			} else {
				this.logError("MainView._receiveMessageFromOnlineApp: received message from illegal origin: " + oEvent.origin);
			}
		},

		_handleLogonSuccess: function() {
			this.getOfflineDatabaseHelper().openDB().then(function() {
				this.logInfo("MainView._handleLogonSuccess: database opened");
				this.getModel(this.constants.models.APP_CONF).setProperty("/user/isAuthenticated", true);
				// after logon get permissions
				this._sendToOnlineApp({
					msgType: this.constants.messageTypes.PERMISSION_DATA
				});
			}.bind(this), function(reason) {
				this.logError("MainView._handleLogonSuccess: Error: " + reason);
				this.logInfo("MainView._handleLogonSuccess: resetting permissions");
				this.getAuthenticationHelper().resetPermissions();
				MessageBox.error(this.translate("db.msg.open.error"), {
					title: this.translate("errorTitle")
				});
			}.bind(this));
		},

		_storeUserData: function(oData) {
			this.getAppConfModel().setProperty("/user/name", oData.userName);
			this.getAppConfModel().setProperty("/user/role", oData.userRole);
		},

		_storeOrderDataToDB: function(oOrder) {
			if (oOrder) {
				// store equi -> order mapping
				if (oOrder.OrderPositionSet && Array.isArray(oOrder.OrderPositionSet.results)) {
					for (var posId in oOrder.OrderPositionSet.results) {
						var oOrderPos = oOrder.OrderPositionSet.results[posId];
						if (oOrderPos.EquipmentSet && Array.isArray(oOrderPos.EquipmentSet.results)) {
							var aEquiToOrders = [];
							var aEquipments = [];
							for (var equiId in oOrderPos.EquipmentSet.results) {
								var oEqui = oOrderPos.EquipmentSet.results[equiId];
								aEquiToOrders.push({
									Backend: oEqui.Backend,
									EquipmentId: oEqui.EquipmentId,
									OrderPosition: oEqui.OrderPosition,
									OrderId: oEqui.OrderId
								});
								aEquipments.push(oEqui);
							}
							// equis are stored separately, remove equis from order-position to avoid storing redundant data
							oOrderPos.EquipmentSet.results = [];
							// equi to order
							this.logInfo("MainView._receiveMessageFromOnlineApp: start mapping equipment to order");
							this.getOfflineDatabaseHelper().addEntries(this.constants.offline_database.object_store_names.EQUI_TO_ORDER, aEquiToOrders).then(
								function() {
									this.logInfo("MainView._receiveMessageFromOnlineApp: mapping equipment to order success");
								}.bind(this),
								function(reason) {
									this.logInfo("MainView._receiveMessageFromOnlineApp: mapping equipment to order failed");
								}.bind(this));
							// equipments
							this.logInfo("MainView._receiveMessageFromOnlineApp: start store equipment");
							this.getOfflineDatabaseHelper().addEntries(this.constants.offline_database.object_store_names.EQUIPMENTS, aEquipments).then(
								function() {
									this.logInfo("MainView._receiveMessageFromOnlineApp: store equipment success");
								}.bind(this),
								function(reason) {
									this.logInfo("MainView._receiveMessageFromOnlineApp: store equipment failed");
								}.bind(this));
						}
					}
				}
				// store order
				this.getOfflineDatabaseHelper().addEntry(this.constants.offline_database.object_store_names.CUSTOMER_ORDERS, oOrder)
					.then(
						function() {
							this.logInfo("MainView._receiveMessageFromOnlineApp: store order '" + oOrder.OrderId + "' success");
						}.bind(this),
						function(reason) {
							this.logError("MainView._receiveMessageFromOnlineApp: store order '" + oOrder.OrderId + "' failed");
						}.bind(this));
			}
		},

		_handleEquipmentReceived: function(oData) {
			if (oData.errorOccured) {
				if (this._errorCallback) {
					this._errorCallback(oData.errorMsg);
				}
			} else {
				this.getOfflineDatabaseHelper().addEntries(this.constants.offline_database.object_store_names.EQUIPMENTS, oData.data).then(
					function() {
						this.logInfo("MainView._handleEquipmentReceived: store equipment success");
						if (this._successCallback) {
							this._successCallback(oData.data);
						}
					}.bind(this),
					function(reason) {
						this.logInfo("MainView._handleEquipmentReceived: store equipment failed");
						if (this._errorCallback) {
							this._errorCallback(reason);
						}
					}.bind(this));
			}
		},

		_handleConfirmationSend: function(oData) {
			if (oData.errorOccured) {
				// TODO decide if and which infos should be shown to user
				this.handleError({
					message: oData.errorMsg
				});
			} else {
				// confirmation successfully send to BE -> remove from indexDB
				this.getOfflineDatabaseHelper().removeEntry(this.constants.offline_database.object_store_names.ORDERPOS_CONFIRMATIONS, oData.data);
			}
		},

		/**
		 * Processes "finished" message from online-app
		 * @param {Object} oData object structured like:
				msgType: "OPERATION_FINSHED",	// should be /utils/Const.messageTypes.OPERATION_FINSHED
				operationFinished: sOperation,	// operation, which was finished: /utils/Const.messageTypes
				errorOccured: true/false,		// error? 
				errorMsg: sErrorMsg				// message containing error details
		 */
		_finishOperation: function(oData) {
			if (oData.operationFinished) {
				switch (oData.operationFinished) {
					case this.constants.messageTypes.DO_SYNC:
						if (oData.errorOccured) {
							// some error occured during sync -> fallback to former database
							this.toggleOfflineDBSuffix();
							var sErrMsg = oData.errorMsg || this.translate("sync.msg.error.unknown");
							MessageBox.error(sErrMsg);
						}
						// delete data from currently not used database
						this.clearUnusedDB();
						break;
					case this.constants.messageTypes.CONFIRMATION_DATA:
						this.getView().getModel(this.constants.models.SAVE_CONFIRMATION_MODEL).setProperty("/elements", []);
						this.getAppConfModel().setProperty("/hasLocalChanges", false);
						this.getView().getModel(this.constants.models.EQUIPMENT_DETAILS).setProperty("/isValid", false);
						// TODO get current data from BE
						//var oEqui = this.getModel(this.constants.models.EQUIPMENT_DETAILS).getProperty("/data");
						//this._refreshEquiDetails(oEqui.EquipmentId, oEqui.Backend);
						break;
				}
			}
			this._closeOnlineApp();
		},

		/**
		 * Sends message to online-app
		 * @param {Object} oData message content; must at least contain property oData.msgType according to /utils/Const.messageTypes
		 */
		_sendToOnlineApp: function(oData) {
			this.logInfo("MainView._sendToOnlineApp: " + JSON.stringify(oData));
			if (this._onlineAppWindow) {
				this._onlineAppWindow.postMessage(oData, this._targetOrigin);
			} else {
				this.logError("MainView._sendToOnlineApp: online-app does not exist!");
			}
		},

		/**
		 * Handles event afterOpen from sap.m.Dialog containing the iFrame of online-app. This event indicates, that online-app is read to receive messages.
		 * Sends DO_LOGIN command.
		 * @param {Object} oEvent unused
		 * @param {Object} oData unused
		 */
		_handleOnlineAppDialogOpened: function(oEvent, oData) {
			if (oData) {
				this._sendToOnlineApp(oData);
			}
		},

		_openOnlineApp: function() {
			// TODO determine URL of online app instead of 'online_app_mock.html'
			this._oOnlineAppContainer.setModel(new JSONModel({
				html: "<iframe src='./online_app_mock.html' style='border-width: 0px;' width='100%' height='100%'/>"
			}), "onlineAppModel");
			this._oOnlineAppContainer.open();
		},

		/* ========================================================================================================== */
		// Event Listener
		/* ========================================================================================================== */

		/**
		 * Creates/deletes local confirmation after checkbox state changed
		 * @param {Object} oEvent
		 */
		handleConfirmationCBSelectChanged: function(oEvent) {
			this._initConfirmationConfigModel();
			var sId = oEvent.getParameter("id");
			var mElements = this.getView().getModel(this.constants.models.SAVE_CONFIRMATION_MODEL).getProperty("/elements");
			var bConfChangedLocally = mElements[sId] !== undefined;

			// get context object OrderPositionOperation
			var oSource = oEvent.getSource();
			var oContext = oSource.getBindingContext(this.constants.models.ORDERPOS_OPERATIONS_MODEL);
			var oOrderPosOperation = oContext.getObject();

			this._getOrderPosConfirmationLocal(oOrderPosOperation).then(function(oConfirmation) {
				var sEquiID = this.getView().getModel(this.constants.models.EQUIPMENT_DETAILS).getProperty("/data/EquipmentId");
				if (bConfChangedLocally) {
					// undo a local change -> delete confirmation from indexDB
					if (oConfirmation) {
						this.logInfo("MainView.handleConfirmationCBSelectChanged: start removing local confirmation from indexDB");
						this._updateConfirmButtonStateModel(oSource, true);
						this.logInfo("MainView.onConfirmationButtonPress: start removing local confirmation from indexDB");
						this._removeOrderPosConfirmationLocal(oConfirmation).then(function() {
							this.logInfo("MainView.handleConfirmationCBSelectChanged: removing local confirmation from indexDB successful");
						}.bind(this), function(reason2) {
							this.logInfo("MainView.handleConfirmationCBSelectChanged: removing local confirmation from indexDB failed");
						}.bind(this));
					}
				} else {
					// create a local confirmation
					var bISStorno = false;
					// do we have a synced confirmation ?
					if (oOrderPosOperation.OrderPositionConfirmation) {
						// is the synced confirmation a storno?
						bISStorno = !oOrderPosOperation.OrderPositionConfirmation.IsStorno;
					}
					oConfirmation = this._createOrderPosConfirmation(oOrderPosOperation, sEquiID, bISStorno);
					var oConfirmationData = {
						that: this,
						checkbox: oSource,
						confirmation: oConfirmation,
						orderPosPosition: oOrderPosOperation
					};
					if (bISStorno) {
						// user must confirm cancellation
						// store context data in tmp model
						this.setModel(new JSONModel(oConfirmationData), "confDataModel");
						this._oCancelConfirmationDialog.open();
					} else {
						this._continueConfirmation.bind(oConfirmationData)();
					}
				}
			}.bind(this), function(reason) {
				// something went wrong -> revert button state
				oSource.setPressed(false);
				this.logError("MainView.handleConfirmationCBSelectChanged: reading confirmation from indexDB failed");
			}.bind(this));
		},

		/**
		 * Capsulates creation of confirmation as finish of 'handleConfirmationCBSelectChanged' and 'handleConfirmCancellationButtonPressed'
		 * this is expected to have following strcture:
		 * {
				that: this, // context of MainView controller
				checkbox: oSource, // Checkbox control
				confirmation: oConfirmation,
				orderPosPosition: oOrderPosOperation
			}
		 */
		_continueConfirmation: function() {
			this.that.logInfo("MainView.handleConfirmationCBSelectChanged: start storing a new 'OrderPositionConfirmation' to indexDB");
			this.that._setOrderPosConfirmationLocal(this.confirmation).then(function() {
				this.that.logInfo("MainView.handleConfirmationCBSelectChanged: stored a new 'OrderPositionConfirmation' to indexDB");
				this.that._updateConfirmButtonStateModel(this.checkbox, false);
			}.bind(this), function(reason1) {
				// something went wrong -> revert button state
				this._updateConfirmButtonStateModel(this.checkbox, true);
				this.checkbox.setSelected(!this.checkbox.getSelected()); // invert selection
				this.that.logError("MainView.handleConfirmationCBSelectChanged: storing new 'OrderPositionConfirmation' to indexDB failed");
			}.bind(this));
		},

		handlePageNavBackButtonPress: function() {
			var oConfDlg = this._getOkCancelDialog(this.translate("label.logoff"), this.translate("auth.quest.logOff"),
				function() {
					this.doLogOff().then(function() {
						oConfDlg.close();
					}.bind(this), function(reason) {
						// TODO handle log-off error
					}.bind(this));
				}.bind(this),
				function() {
					oConfDlg.close();
				}.bind(this));
			oConfDlg.open();
		},

		handleConfigurationPress: function(oEvent) {
			var oEquiDetailsModel = this.getComponentModel(this.constants.models.EQUIPMENT_DETAILS);
			if (oEquiDetailsModel) {
				var oEqui = oEquiDetailsModel.getProperty("/data");
				this.logInfo("MainView.handleConfigurationPress: start get equipments from indexDB");
				this.getOfflineDatabaseHelper().getEntries(this.constants.offline_database.object_store_names.EQUIPMENTS).then(function(aEquis) {
					this.logInfo("MainView.handleConfigurationPress: get equipments from indexDB success");
					if (Array.isArray(aEquis)) {
						// only one equi of a given order AND position does contain a configuration
						var oEquiWithConfig = aEquis.find(function(oTmpEqui) {
							return (oTmpEqui.Backend === oEqui.Backend) && (oTmpEqui.OrderId === oEqui.OrderId)&& (oTmpEqui.OrderPosition === oEqui.OrderPosition) && !!oTmpEqui.Configuration;
						});
						if (oEquiWithConfig) {
							var oDialog = this._getConfigurationHtmlDialog();
							this.getView().setModel(new JSONModel({
								html: oEquiWithConfig.Configuration
							}), "ConfigurationHtml");
							oDialog.open();
						} else {
							// none of these equis contain a configuration
							MessageBox.error(this.translate("equi.msg.error.noConfig"), {
								title: this.translate("equi.configuration")
							});
						}
					}
				}.bind(this), function(reason) {
					this.logError("MainView.handleConfigurationPress: get equipments from indexDB failed");
				}.bind(this));
			}
		},

		handleCloseHtmlDialog: function(oEvent) {
			// clear html data, otherwise same html content will be appended on next open (for unknown reason)
			this.getView().setModel(new JSONModel({
				html: undefined
			}), "ConfigurationHtml");
			this._getConfigurationHtmlDialog().close();
		},

		/**
		 * Opens up sap.m.Dialog containing online-app iFrame
		 */
		handleLogonButtonPressed: function(oEvent) {
			this._openOnlineAppEventData.msgType = this.constants.messageTypes.DO_LOGIN;
			this._openOnlineApp();
			/*			this.doLogOn().then(function() {
							MessageBox.success(this.translate("logon.msg.loggedIn"), {
								title: this.translate("label.logon"),
								onClose: this._refreshOrderPosOperationsModel.bind(this)
							});
						}.bind(this), function(reason) {
							MessageBox.error(this.translate("logon.msg.logon.failed"), {
								title: this.translate("label.logon"),
								onClose: function() {
								}.bind(this)
							});
						}.bind(this));
			*/
		},

		handleOnlineAppCancelPressed: function(oEvent) {
			this._closeOnlineApp();
		},

		_closeOnlineApp: function() {
			// remove html code (including iframe) from model, because close() triggers refresh and reloads iframe
			this._oOnlineAppContainer.getModel("onlineAppModel").setProperty("/html", "");
			this._oOnlineAppContainer.close();
		},

		handleSyncButtonPressed: function(oEvent) {
			this.lockView();
			// before sync change database
			this.toggleOfflineDBSuffix();
			// clear all db contents
			this.getOfflineDatabaseHelper().clearAllObjectStores().then(function() {
				this.unlockView();
				// now ready for sync
				this._openOnlineAppEventData.msgType = this.constants.messageTypes.DO_SYNC;
				this._openOnlineApp();
			}.bind(this), function(reason) {
				// fallback to former database
				this.toggleOfflineDBSuffix();
				this.handleError(reason);
				this.unlockView();
			}.bind(this));
		},

		handleSendDataButtonPressed: function(oEvent) {
			if (this.isAppOnline()) {
				this.logInfo("MainView.handleSendDataButtonPressed: start collect transient confirmations data from indexDB");
				this.getOfflineDatabaseHelper().getEntries(this.constants.offline_database.object_store_names.ORDERPOS_CONFIRMATIONS).then(
					function(aConfirmations) {
						if (aConfirmations && Array.isArray(aConfirmations)) {
							this._openOnlineAppEventData.msgType = this.constants.messageTypes.CONFIRMATION_DATA;
							this._openOnlineAppEventData.data = aConfirmations;
							this._openOnlineApp();
						} else {
							this.logError("MainView.handleSendDataButtonPressed: collect transient confirmations data from indexDB failed!");
						}
					}.bind(this),
					function() {
						this.unlockView();
						this.handleError({
							message: "MainView.handleSendDataButtonPressed: collect transient data from indexDB failed"
						});
					}.bind(this));
			}
		},

		selectEquiBackend: function(oEvent) {
			var sExtractEquipmentNumber = this.getView().getModel(this.constants.models.EQUIPMENT_DETAILS).getProperty("/data/EquipmentId");
			this._determineEquipmentDetails(sExtractEquipmentNumber);
		},

		handleBarcodeScanPress: function(oEvent) {
			this.scanCode().then(function(oScanResult) {
				if (oScanResult) {
					this.lockView();
					this._findBackendCodesByQRCodeType(oScanResult.format).then(function(aResult) {
						if (aResult && aResult.length > 0) {
							var oResult = aResult[0];
							var sBackendId;
							// result is unique? otherwise, backend id can not be determined automatically and stays undefined
							if (aResult.length === 1) {
								sBackendId = oResult.BackendFk;
							}
							this._extractEquipmentNumber(oResult, oScanResult.text).then(function(sExtractEquipmentNumber) {
								this._determineEquipmentDetails(sExtractEquipmentNumber, sBackendId);
							}.bind(this));
						} else {
							MessageBox.error(this.translate("scan.msg.error.data.invalid"));
						}
						this.unlockView();
					}.bind(this), function(oError) {
						this.unlockView();
					}.bind(this));
				} else {
					MessageBox.error(this.translate("scan.msg.error.failed"));
				}
			}.bind(this), function(reason) {
				MessageBox.error(reason);
			}.bind(this));
		},

		handleEquipmentSearchPress: function(oEvent) {
			this._oEnterSerialNumDialog.open();
		},

		handleShowHelpButtonPressed: function() {
			alert("Anzeige Hilfe, Datenschutzerklärung, usw.");
		},

		handleOrderListButtonPressed: function(oEvent) {
			this.oRouter.navTo("OrderList");
		},

		handleEnterSerialConfirm: function(oEvent) {
			this._oEnterSerialNumDialog.close();
			var oEquiDetailsModel = this.getComponentModel(this.constants.models.EQUIPMENT_DETAILS);
			oEquiDetailsModel.setProperty("/isValid", false);
			var sEquiNr = oEquiDetailsModel.getProperty("/data/EquipmentId");
			this._determineEquipmentDetails(sEquiNr);
		},

		handleEnterSerialDecline: function(oEvent) {
			this._oEnterSerialNumDialog.close();
		},

		handleEquiSelectionChanged: function(oEvent) {
			this._oSelectedEquiListItem = oEvent.getParameter("listItem");
			this.getComponentModel(this.constants.models.EQUIPMENT_LIST).setProperty("/hasSelection", !!this._oSelectedEquiListItem);
		},

		handlePhoneCallPress: function(oEvent) {
			if (window.plugins && window.plugins.CallNumber) {
				var sTelephoneNumber = oEvent.getSource().getText();
				window.plugins.CallNumber.callNumber(function(oEvent) {
					//debugger;
				}.bind(this), function(oEvent) {
					//debugger;
				}.bind(this), sap.m.URLHelper.normalizeTel(sTelephoneNumber), true);
			} else {
				MessageBox.error(this.translate("msg.error.no.phone"));
			}
		},

		handleConfirmSelectEquipment: function(oEvent) {
			if (this._oSelectedEquiListItem) {
				var oContext = this._oSelectedEquiListItem.getBindingContext("equipmentListModel");
				if (oContext) {
					var oSelectedEqui = oContext.getObject();
					this._oSelectedEquiListItem.setSelected(false);
					this._oSelectedEquiListItem = undefined;
					this._oSelectEquiDialog.close();
					this._refreshEquiDetails(oSelectedEqui.EquipmentId, oSelectedEqui.Backend);
				}
			}
		},

		handleDeclineSelectEquipment: function(oEvent) {
			if (this._oSelectedEquiListItem) {
				this._oSelectedEquiListItem.setSelected(false);
			}
			this._oSelectedEquiListItem = undefined;
			this._oSelectEquiDialog.close();
		},

		handleConfirmCancellationButtonPressed: function(oEvent) {
			var oConfModel = this.getModel("confDataModel");
			var oConfdata = oConfModel.getProperty("/");
			this._continueConfirmation.bind(oConfdata)();
			this._oCancelConfirmationDialog.close();
		},

		handleDeclineCancellationButtonPressed: function(oEvent) {
			var oConfModel = this.getModel("confDataModel");
			var oConfdata = oConfModel.getProperty("/");
			oConfdata.checkbox.setSelected(!oConfdata.checkbox.getSelected()); // invert selection
			this._oCancelConfirmationDialog.close();
		}

	});
}, /* bExport= */ true);