sap.ui.define([
	"com/sap/build/axians/novofermMobil/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox"
], function(BaseController, JSONModel, Filter, FilterOperator, MessageBox) {
	"use strict";

	return BaseController.extend("com.sap.build.axians.novofermMobil.controller.EquiList", {

		_oRouter: undefined,


		/* ========================================================================================================== */
		/* Lifecycle methods
		/* ========================================================================================================== */

		onInit: function() {
			this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this._oRouter.getRoute("EquiList").attachPatternMatched(this._handleEnterRoute.bind(this), this);
		},

		/* ========================================================================================================== */
		// Private Functions
		/* ========================================================================================================== */

		_handleEnterRoute: function(oEvent) {
		},

		handlePageNavBackButtonPress: function() {
			this._oRouter.navTo("OrderList");
		}

	});
}, /* bExport= */ true);
