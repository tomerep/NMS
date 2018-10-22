sap.ui.define([
	"com/sap/build/axians/novofermMobil/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox"
], function(BaseController, JSONModel, Filter, FilterOperator, MessageBox) {
	"use strict";

	return BaseController.extend("com.sap.build.axians.novofermMobil.controller.OrderList", {

		_oRouter: undefined,

		_oAddOrderDialog: null,
		_sAddOrderDialog: "com.sap.build.axians.novofermMobil.view.fragments.AddOrderDialog",
		_sAddOrderDialogId: "addOrderDialogId",

		/* ========================================================================================================== */
		/* Lifecycle methods
		/* ========================================================================================================== */

		onInit: function() {
			this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this._oRouter.getRoute("OrderList").attachPatternMatched(this._handleEnterRoute.bind(this), this);

			this._oAddOrderDialog = sap.ui.xmlfragment(this._sAddOrderDialogId, this._sAddOrderDialog, this);
			this.getView().addDependent(this._oAddOrderDialog);
		},

		/* ========================================================================================================== */
		// Private Functions
		/* ========================================================================================================== */

		_handleEnterRoute: function(oEvent) {
			this._refreshOrderList();
		},

		_refreshOrderList: function() {
			/*
						// TODO merge with local added orders
						this.getComponentModel().read("/OrderPosition", {
							success: function(oData) {
								var oModel = new JSONModel(oData);
								this.setComponentModel(oModel, this.constants.models.ORDER_LIST);
							}.bind(this),
							error: function(oError) {
								// TODO handle read error
							}.bind(this)
						});
			*/
		},

		_getOrderListControl: function() {
			return this.getView().byId("orderListId");
		},

		/* ========================================================================================================== */
		// Functions
		/* ========================================================================================================== */

		getQueryParameters: function(oLocation) {
			var oQuery = {};
			var aParams = oLocation.search.substring(1).split("&");
			for (var i = 0; i < aParams.length; i++) {
				var aPair = aParams[i].split("=");
				oQuery[aPair[0]] = decodeURIComponent(aPair[1]);
			}
			return oQuery;

		},

		/* ========================================================================================================== */
		// Event Listener
		/* ========================================================================================================== */

		handlePageNavBackButtonPress: function() {
			this._oRouter.navTo("MainView");
		},

		handleOrderListItemPressed: function(oEvent) {
			var oItem = oEvent.getParameter("listItem");
			if (oItem) {
				var oContext = oItem.getBindingContext("orderListModel");
				var oCustomerOrder = oContext.getObject();
				this._oRouter.navTo("EquiList", {orderid: oCustomerOrder.OrderId});
				// this._oRouter.navTo("EquiList");
			}
		},

		handleSearchOrderLiveChange: function(oEvent) {
			var sFilterValue = oEvent.getParameter("newValue");
			var oBinding = this._getOrderListControl().getBinding("items");
			oBinding.filter(new Filter({
				filters: [
					new Filter("OrderId", FilterOperator.Contains, sFilterValue),
					new Filter("PositionNo", FilterOperator.Contains, sFilterValue)
				],
				and: false
			}));
		},

		handleOrderidChanged: function(oEvent) {
			var bIsValid = true;
			var sOrderid = oEvent.getParameter("newValue");
			if (sOrderid) {
				var oOrderListModel = this.getModel("orderListModel");
				if (oOrderListModel) {
					var aOrders = oOrderListModel.getProperty("/").results;
					if (Array.isArray(aOrders)) {
						for (var i in aOrders) {
							if (aOrders[i].OrderId === sOrderid) {
								bIsValid = false;
								break;
							}
						}
					}
				}
				this._oAddOrderDialog.getModel("addOrderNumberModel").setProperty("/isOrderNumberValid", bIsValid);
				this._oAddOrderDialog.getModel("addOrderNumberModel").setProperty("/valueStateMsg", bIsValid ? "" : this.translate("order.err.msg.already.exists"));
			} else {
				this._oAddOrderDialog.getModel("addOrderNumberModel").setProperty("/isOrderNumberValid", false);
				this._oAddOrderDialog.getModel("addOrderNumberModel").setProperty("/valueStateMsg", "");
			}
		},

		handleAddOrderButtonPressed: function(oEvent) {
			this._oAddOrderDialog.setModel(new JSONModel({orderid: "", isOrderNumberValid: false, valueStateMsg: ""}), "addOrderNumberModel");
			this._oAddOrderDialog.open();
		},
		handleAddOrderOKButtonPressed: function(oEvent) {
			this._oAddOrderDialog.close();

		},
		handleAddOrderCancelButtonPressed: function(oEvent) {
			this._oAddOrderDialog.close();
		}

	});
}, /* bExport= */ true);
