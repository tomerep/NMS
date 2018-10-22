sap.ui.define([], function () {
	"use strict";
	return {
		models: {
			APP_CONF: "appConfModel",
			ANONYMOUS: "anonymousModel",
			BACKENDCODE_MODEL: "backendCodeModel",
			PERMISSIONS_MODEL: "permissionsModel",
			ORDER_MODEL: "orderModel",
			ORDER_LIST: "orderListModel",
			EQUIPMENT_LIST: "equipmentListModel", // for backend-id selection purpose only, if an equi-id is not unique
			EQUIPMENT_DETAILS: "equipmentDetailsModel",
			OK_CANCEL_DLG_DATA: "okCancelDialogDataModel",
			ORDERPOS_OPERATIONS_MODEL: "orderPosOperationsModel",
			SAVE_CONFIRMATION_MODEL: "saveConfirmationModel"
		},
		userRoles: {
			ANONYMOUS: "anonymous"
		},
		scriptnames: {
			equipment: {
				list: "EquipmentIds.xsjs",
				details: "EquipmentDetail.xsjs"
			}
		},
		offline_database: {
			object_store_names: {
				CUSTOMER_ORDERS: "customerOrders",
				ORDERPOS_CONFIRMATIONS: "orderposConfirmations",
				EQUIPMENTS: "equipments",
				EQUI_TO_ORDER: "equiToOrder"
			},
			nameSuffices: {
				A: "-A",
				B: "-B"
			},
		},
		localStorage: {
			OFFLINE_DB_SUFFIX: "offlineDBSuffix",
			EQUI_SCANNED_OFFLINE: "equiScannedOffline"
		},
		messageTypes: {
			ONLINE_APP_LOADED: "ONLINE_APP_LOADED",
			DO_LOGIN: "DO_LOGIN",
			DO_SYNC: "DO_SYNC",
			LOGIN_SUCCESSFUL: "LOGIN_SUCCESSFUL",
			USER_DATA: "USER_DATA",
			ORDER_DATA: "ORDER_DATA",
			EQUI_DATA: "EQUI_DATA",
			CONFIRMATION_DATA: "CONFIRMATION_DATA",
			CONFIRMATION_SEND: "CONFIRMATION_SEND",
			PERMISSION_DATA: "PERMISSION_DATA",
			OPERATION_FINSHED: "OPERATION_FINSHED"
		}
	}
});