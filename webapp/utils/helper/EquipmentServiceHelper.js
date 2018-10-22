sap.ui.define([
	"com/sap/build/axians/novofermMobil/utils/helper/CoreServiceHelper"
], function(CoreServiceHelper) {
	"use strict";

	var EquipmentServiceHelper = CoreServiceHelper.extend("com.sap.build.axians.novofermMobil.utils.helper.EquipmentServiceHelper", {

		constructor: function(oOwnerComponent) {
			CoreServiceHelper.prototype.constructor.apply(this, arguments);
		},

		metadata: {
			publicMethods: [],
			privateMethods: []
		},

		getEquipmentList: function(sEquiId) {
			this._oOwnerComponent.logInfo("EquipmentServiceHelper.getEquipmentList: start reading equi list");
			return new Promise(function(fResolve, fReject) {
				if (sEquiId) {
					this.getServiceUrl(true).then(function(sServiceUrl) {
						// first get overview on all possible equipments
						sServiceUrl += this.constants.scriptnames.equipment.list + "?EquipmentID=";
						sServiceUrl += sEquiId;
						this.executeHTTPRequest(sServiceUrl).then(function(oResponse) {
							this._oOwnerComponent.logInfo("EquipmentServiceHelper.getEquipmentList: reading equi list successful");
							fResolve(oResponse);
						}.bind(this), function(reason1) {
							fReject(reason1);
						}.bind(this));
					}.bind(this), function(reason) {
						fReject(reason);
					}.bind(this));
				} else {
					fReject(this._oOwnerComponent.translate("equi.msg.equinum.invalid"));
				}
			}.bind(this));
		},

		getEquipmentDetails: function(sEquiId, sBEId, sLangId) {
			this._oOwnerComponent.logInfo("EquipmentServiceHelper.getEquipmentDetails: start reading equi details");
			return new Promise(function(fResolve, fReject) {
				if (sEquiId) {
					if (sBEId) {
						this.getServiceUrl(true).then(function(sServiceUrl) {
							// first get overview on all possible equipments
							sServiceUrl += this.constants.scriptnames.equipment.details + "?EquipmentID=";
							sServiceUrl += sEquiId;
							if (sBEId) {
								sServiceUrl += "&Backend=" + sBEId;
							}
							if (sLangId) {
								sServiceUrl += "&Language=" + sLangId;
							}
							this.executeHTTPRequest(sServiceUrl).then(function(oResponse) {
								if (Array.isArray(oResponse) && oResponse.length > 0) {
									this._oOwnerComponent.logInfo("EquipmentServiceHelper.getEquipmentDetails: reading equi details successful");
									fResolve(oResponse[0]);
								} else {
									fReject(this._oOwnerComponent.translate("equi.msg.error.noDetails"));
								}
							}.bind(this), function(reason1) {
								fReject(reason1);
							}.bind(this));
						}.bind(this), function(reason) {
							fReject(reason);
						}.bind(this));
					} else {
						fReject(this._oOwnerComponent.translate("equi.msg.equinum.invalid"));
					}
				} else {
					fReject(this._oOwnerComponent.translate("equi.msg.equinum.invalid"));
				}
			}.bind(this));
		}

	});

	return EquipmentServiceHelper;
});