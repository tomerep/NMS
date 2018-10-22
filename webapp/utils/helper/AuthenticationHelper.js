sap.ui.define([
	"sap/ui/base/Object",
	"com/axians/itsolutions/ui5/nmsmp/utils/commonUtils/Logger",
	"com/sap/build/axians/novofermMobil/model/models",
	"com/sap/build/axians/novofermMobil/utils/Const"
], function(BaseObject, Logger, models, Const) {
	"use strict";

	var AuthenticationHelper = BaseObject.extend("com.sap.build.axians.novofermMobil.utils.helper.AuthenticationHelper", {

		_oOwnerComponent: undefined,

		metadata: {
			publicMethods: [],
			privateMethods: []
		},

		constructor: function(oOwnerComponent) {
			this._oOwnerComponent = oOwnerComponent;
		},

		/**
		 * Resets permissions back to 'anonymous' (including derived permissions)
		 */
		resetPermissions: function() {
			Logger.info("AuthenticationHelper.resetPermissions: resetting permissions");
			var oPermModel = models.createDefaultPermissionsModel();
			this._oOwnerComponent.setModel(oPermModel, Const.models.PERMISSIONS_MODEL);
			this._updateDerivedPermissions(oPermModel.getProperty("/"));
			oPermModel.refresh(true);
		},

		/**
		 * First resets permissions to 'anonymous' and then applies given permissions and calcs derives permissions
		 * @param {Array} aPermissions array of Authorization objects
		 */
		updatePermissions: function(aPermissions) {
			this.resetPermissions();
			if (Array.isArray(aPermissions)) {
				var oPermissionsModel = this._oOwnerComponent.getModel(Const.models.PERMISSIONS_MODEL);
				for (var i in aPermissions) {
					oPermissionsModel.setProperty("/" + aPermissions[i].Authorization, true);
				}
				this._updateDerivedPermissions(oPermissionsModel.getProperty("/"));
			}
		},

		/**
		 * Calculates boolean-flags controlling UI, Sync etc
		 * @param {Object} oPermissionsData contained in Const.models.PERMISSIONS_MODEL
		 */
		_updateDerivedPermissions: function(oPermissionsData) {
			var oAppConfModel = this._oOwnerComponent.getModel(Const.models.APP_CONF);
			// orders
			oAppConfModel.setProperty("/views/showOrderList", oPermissionsData.list_orders);
			oAppConfModel.setProperty("/views/showSyncButton", oPermissionsData.list_orders);
			// confirmations -> read
			var bReadConfirmationsPermitted = oPermissionsData.read_any_confirmation ||
				oPermissionsData.read_company_confirmation ||
				oPermissionsData.read_own_confirmation ||
				oPermissionsData.read_any_confirmation_ai ||
				oPermissionsData.read_company_confirmation_ai ||
				oPermissionsData.read_own_confirmation_ai;
			oAppConfModel.setProperty("/views/showConfirmations", bReadConfirmationsPermitted);
			// confirmations -> write
			var bConfirmPermitted = oPermissionsData.confirm_any_order ||
				oPermissionsData.confirm_company_order ||
				oPermissionsData.confirm_own_order ||
				oPermissionsData.confirm_any_order_ai ||
				oPermissionsData.confirm_company_order_ai ||
				oPermissionsData.confirm_own_order_ai;
			var bCancellationPermitted = oPermissionsData.cancel_any_confirmation ||
				oPermissionsData.cancel_company_confirmation ||
				oPermissionsData.cancel_own_confirmation ||
				oPermissionsData.cancel_any_confirmation_ai ||
				oPermissionsData.cancel_company_confirmation_ai ||
				oPermissionsData.cancel_own_confirmation_ai;
			oAppConfModel.setProperty("/views/showSendDataButton", bConfirmPermitted || bCancellationPermitted);
			// partner
			var bShowPartnerData = oPermissionsData.read_partner_MFC ||
				oPermissionsData.read_partner_MM ||
				oPermissionsData.read_partner_PL ||
				oPermissionsData.read_partner_ai_PL ||
				oPermissionsData.read_partner_ai_MM ||
				oPermissionsData.read_partner_ai_MFC;
			oAppConfModel.setProperty("/views/showPartnerData", bShowPartnerData);
		}

	});

	return AuthenticationHelper;
});