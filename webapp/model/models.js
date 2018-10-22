sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function(JSONModel, Device) {
	"use strict";

	return {
		createDeviceModel: function() {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createFLPModel: function() {
			var fnGetuser = jQuery.sap.getObject("sap.ushell.Container.getUser"),
				bIsShareInJamActive = fnGetuser ? fnGetuser().isJamActive() : false,
				oModel = new JSONModel({
					isShareInJamActive: bIsShareInJamActive
				});
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		/**
		 * Creates initial model reflecting state of app (logon, views, etc)
		 * @returns {*}
		 */
		createAppConfModel: function() {
			return new JSONModel({
				// TODO for initialization use cordova-plugin-network-information, navigator.connection.type
				isAppOnline: !window.cordova, // in cordova context initially false, in WebIDE context initially true
				isSubmitLocked: false, // user requested a submit operation, which is still running?
				hasLocalChanges: false, // local changes not yet send to BE
				isDebugMode: true,
				views: {
					showOrderList: false,
					showConfirmations: false,
					showPartnerData: false,
					showSendDataButton: false,
					showSyncButton: false
				},
				user: {
					name: "anonymous",
					role: "anonymous",
					isAuthenticated: false // user has loged on?
				}
			});
		},

		/**
		 * Creates initial permissions according to role 'anonymous'
		 * Property 'app_impersonation' indicates, if permissions apply to app context. If not, user will be treated as 'anonymous'.
		 * @returns {*}
		 */
		createDefaultPermissionsModel: function() {
			return new JSONModel({
				app_impersonation: false,
				equipment_read: true,
				document_read: false,
				read_order_by_equipment: false,
				read_order_by_id: false,
				list_orders: false,
				view_order_detail: false,
				add_addorder: false,
				confirm_any_order: false,
				confirm_company_order: false,
				confirm_own_order: false,
				confirm_any_order_ai: false,
				confirm_company_order_ai: false,
				confirm_own_order_ai: false,
				read_any_confirmation: false,
				read_company_confirmation: false,
				read_own_confirmation: false,
				read_any_confirmation_ai: false,
				read_company_confirmation_ai: false,
				read_own_confirmation_ai: false,
				cancel_any_confirmation: false,
				cancel_company_confirmation: false,
				cancel_own_confirmation: false,
				cancel_any_confirmation_ai: false,
				cancel_company_confirmation_ai: false,
				cancel_own_confirmation_ai: false,
				read_configuration: false,
				read_legal_dates: false,
				read_warrenty_end_ai: false,
				read_partner_MFC: false,
				read_partner_MM: false,
				read_partner_PL: false,
				read_partner_ai_PL: false,
				read_partner_ai_MM: false,
				read_partner_ai_MFC: false,
				read_last_service_any: false,
				read_last_service_company: false,
				read_last_service_own: false
			});
		},

		createEquipmentDetailsModel: function() {
			return new JSONModel({
				isValid: false,
				data: {}
			});
		},

		createEquipmentListModel: function() {
			return new JSONModel({
				results: []
			});
		},

		createOkCancelDlgDataModel: function() {
			return new JSONModel({
				title: "",
				text: "",
				fConfirm: null,
				fDecline: null
			});
		}

	};

});