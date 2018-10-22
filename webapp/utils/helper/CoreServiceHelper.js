sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/model/BindingMode",
	"sap/ui/model/odata/CountMode",
	"com/sap/build/axians/novofermMobil/utils/Const"
], function(BaseObject, ODataModel, BindingMode, CountMode, Const) {
	"use strict";

	var CoreServiceHelper = BaseObject.extend("com.sap.build.axians.novofermMobil.utils.helper.CoreServiceHelper", {

		constants: Const,
		_oOwnerComponent: undefined,
		_oManifestdata: undefined,
		_oODataModels: {},
	
		metadata: {
			publicMethods: [],
			privateMethods: []
		},

		constructor: function(oOwnerComponent) {
			this._oOwnerComponent = oOwnerComponent;
		},

		/**
		 * Resolves a service-url
		 * @param bIsAnonymous true, the url ends up with '/anonymous/'. This can be used to append EquipmentIds.xsjs, EquipmentDetail.xsjs calls; false, the url end up with '/Service.xsodata/'
		 * @returns {Promise} rejects on erros while communication with server
		 */
		getServiceUrl: function(bIsAnonymous) {
			this._oOwnerComponent.logInfo("CoreServiceHelper.getServiceUrl: starting");
			return new Promise(function(fResolve, fReject) {
				if (this._oManifestdata) {
					this._determineServiceUrl.bind(this)(bIsAnonymous, fResolve, fReject);
				} else {
					$.getJSON("manifest.json", function(oData) {
						this._oManifestdata = oData;
						this._determineServiceUrl.bind(this)(bIsAnonymous, fResolve, fReject);
					}.bind(this));
				}
			}.bind(this));
		},

		getODataModel: function(bIsAnonymous) {
			this._oOwnerComponent.logInfo("CoreServiceHelper.getODataModel: starting");
			return new Promise(function(fResolve, fReject) {
				// create odata model
				this.getServiceUrl(bIsAnonymous).then(function(sServiceUrl) {
					if (bIsAnonymous) {
						// in case of 'anonymous' we have to append a special xsodata
						sServiceUrl += this._oManifestdata["sap.app"].urls.serviceUrlAnonymousSuffix;
					}
					this._createODataModel(sServiceUrl, !bIsAnonymous).then(function(oODataModel) {
						this._oOwnerComponent.logInfo("CoreServiceHelper.getODataModel: successful");
						fResolve(oODataModel);
					}.bind(this), function(reason1) {
						fReject(reason1);
					});
				}.bind(this), function(reason) {
					fReject(reason);
				}.bind(this));
			}.bind(this));
		},

		getOnlineAppUrl: function() {
			return new Promise(function(fResolve, fnError) {
				this.getBuildProfile().then(function(sBuildProfile) {
					var sApplicationEndpointURL = this._oOwnerComponent._getManifestEntry("sap.mobile", true).logon.mainService[sBuildProfile].onlineAppUrl;
					fResolve(sApplicationEndpointURL);
				}, function(sError) {
					fnError(sError);
				});
			}.bind(this));
		},

		getBuildProfile: function() {
			return this._getBuildStuff("_buildProfile", "@@appProfile");
		},

		getBuildDate: function() {
			return this._getBuildStuff("_buildDate", "@@buildDate");
		},

		getBuildCommit: function() {
			return this._getBuildStuff("_commit", "@@commit");
		},

		_getBuildStuff: function(sBuildProperty, sBuildReplaceProperty) {
			return new Promise(function(fResolve, fnReject) {
				var sProfile = this._oOwnerComponent.getManifest()[sBuildProperty];
				if (sBuildReplaceProperty === sProfile) {
					//fnReject(sBuildReplaceProperty + " is not a valid profile");
					fResolve(sBuildReplaceProperty + " is not a valid profile");
				} else {
					fResolve(sProfile);
				}
			}.bind(this));
		},

		_determineServiceUrl: function(bIsAnonymous, fResolve, fReject) {
			this._oOwnerComponent.logInfo("CoreServiceHelper._determineServiceUrl: starting");
			var sServiceUrl = undefined;
			if (bIsAnonymous) {
				// not auth required
				this._oOwnerComponent.logInfo("CoreServiceHelper._determineServiceUrl: successful");
				var sApplicationEndpointURL = "";
				if (window.cordova !== undefined) {
					var sProfile = this._oOwnerComponent.getManifest()._buildProfile;
					var sApplicationEndpointURL = this._oOwnerComponent._getManifestEntry("sap.mobile", true).logon.mainService[sProfile].serverHost;
				}
				fResolve(sApplicationEndpointURL + this._oOwnerComponent._getManifestEntry("sap.app", true).urls.serviceUrlPrefix);
			} else {
				// get role id from RoleService
				var sRoleServiceUrl = this._oManifestdata["sap.app"].urls.serviceUrlPrefix + this._oManifestdata["sap.app"].urls.roleServiceUrlSuffix;
				this.executeHTTPRequest(sRoleServiceUrl, { key: "Authorization", value: "Basic " + this._sB64Credentials } ).then(function(oResponse) {
					if (oResponse && oResponse.ServiceSuffix) {
						var sServiceUrl = this._oManifestdata["sap.app"].urls.serviceUrlPrefix + oResponse.ServiceSuffix + "/" + this._oManifestdata["sap.app"].urls.serviceUrlSuffix;
						this._oOwnerComponent.logInfo("CoreServiceHelper._determineServiceUrl: successful");
						fResolve(sServiceUrl);
					} else {
						fReject("Unexpected answer ('" + oRequest.responseText + "') from service: " + sRoleServiceUrl);
					}
				}.bind(this), function(reason) {
					fReject(reason);
				}.bind(this));
			}
		},

		executeHTTPRequest: function(sServiceUrl, oAuthHeader) {
			this._oOwnerComponent.logInfo("CoreServiceHelper.executeHTTPRequest: starting");
			return new Promise(function(fResolve, fReject) {
				var oRequest = new XMLHttpRequest();
				oRequest.open("GET", sServiceUrl);
				oRequest.addEventListener('load', function(event) {
					if (oRequest.status >= 200 && oRequest.status < 300) {
						// valid response
						try {
							this._oOwnerComponent.logInfo("CoreServiceHelper.executeHTTPRequest: successful");
							fResolve(JSON.parse(oRequest.responseText));
						} catch (ex) {
							fReject(ex);
						}
					} else {
						// invalid response
						fReject(oRequest.statusText + ": " + oRequest.responseText);
					}
				}.bind(this));
				// oRequest.setRequestHeader("X-SMP-APPCID", this._oManifestdata["sap.app"].id);
				if (oAuthHeader) {
					oRequest.setRequestHeader(oAuthHeader.key, oAuthHeader.value);
				}
				oRequest.setRequestHeader("Accept", "application/json");
				oRequest.send();

			}.bind(this));
		},

		_createODataModel: function(sServiceUrl, bDoAuthenticate) {
			this._oOwnerComponent.logInfo("CoreServiceHelper._createODataModel: starting");
			return new Promise(function(fResolve, fReject) {
				// set 'useBatch' to false, otherwise server responds with 403
				var oConfig = {
					json: true,
					bTokenHandling: true,
					useBatch: true,
					defaultBindingMode: BindingMode.TwoWay,
					defaultCountMode: CountMode.Request
				};

				if (bDoAuthenticate) {
					oConfig.headers = this._getAuthHeader();
				}
				var oModel = new ODataModel(sServiceUrl, oConfig);
				oModel.attachMetadataLoaded(function() {
					this._oOwnerComponent.logInfo("CoreServiceHelper._createODataModel: successful");
					fResolve(oModel);
				}.bind(this));
				oModel.attachMetadataFailed(function(oError) {
					fReject("Failed to read metadata from service: " + sServiceUrl);
				}.bind(this));
			}.bind(this));
		},

		_getAuthHeader: function() {
			'use strict';
			return {
				// "X-SMP-APPCID": "com.sap.build.axians.novofermMobil", // TODO check, which id is correct
				//"Authorization": "Basic " + this._sB64Credentials
			};
		}

	});

	return CoreServiceHelper;
});