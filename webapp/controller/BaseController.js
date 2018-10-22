sap.ui.define([
	"com/axians/itsolutions/ui5/nmsmp/libraries/core/NMSMPController",
	"com/sap/build/axians/novofermMobil/utils/Const"
], function(Controller, Const) {
	"use strict";

	return Controller.extend("com.sap.build.axians.novofermMobil.controller.BaseController", {

		constants: Const,

		/*
				doSync: function() {
					return this.getOwnerComponent().doSync();
				},
				//*/
		/*
		doLogOn: function() {
			return this.getOwnerComponent().doLogOn();
		},
		doLogOff: function() {
			return this.getOwnerComponent().doLogOff();
		},
		//*/

		getEquipmentsScannedOffline: function() {
			return this.getOwnerComponent().getEquipmentsScannedOffline();
		},

		setEquipmentsScannedOffline: function(oEquiScannedOffline) {
			this.getOwnerComponent().setEquipmentsScannedOffline(oEquiScannedOffline);
		},

		getOfflineDBSuffix: function() {
			return this.getOwnerComponent().getOfflineDBSuffix();
		},

		toggleOfflineDBSuffix: function() {
			return this.getOwnerComponent().toggleOfflineDBSuffix();
		},
		
		clearUnusedDB: function(){
			return this.getOwnerComponent().clearUnusedDB();
		},

		getCoreServiceHelper: function() {
			return this.getOwnerComponent().getCoreServiceHelper();
		},
		getEquipmentServiceHelper: function() {
			return this.getOwnerComponent().getEquipmentServiceHelper();
		},

		getOfflineDatabaseHelper: function() {
			return this.getOwnerComponent().getOfflineDatabaseHelper();
		},

		getAuthenticationHelper: function() {
			return this.getOwnerComponent()._oAuthenticationHelper;
		},
		
		getAppConfModel: function() {
			return 	this.getOwnerComponent().getModel(this.constants.models.APP_CONF);
		},

		lockSubmitData: function() {
			this.getOwnerComponent().lockSubmitData();
		},
		unlockSubmitData: function() {
			this.getOwnerComponent().unlockSubmitData();
		},
		isSubmitDataLocked: function() {
			return this.getOwnerComponent().isSubmitDataLocked();
		},
		/**
		 * Stores flag indicating, that user has local data not yet send to BE
		 * @param {Boolean} bHasLocalChanges optional: if omitted, defaults to true
		 */
		setHasLocalChanges: function(bHasLocalChanges) {
			this.getOwnerComponent().setHasLocalChanges(bHasLocalChanges);
		},
		/**
		 * @returns {Boolean} flag indicating, if user has local data not yet send to BE
		 */
		hasLocalChanges: function() {
			return this.getOwnerComponent().hasLocalChanges();
		},

		isAppOnline: function() {
			return this.getOwnerComponent().isAppOnline();
		}

	});

});