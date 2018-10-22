window.onload = function () {

	if (jQuery.sap.getUriParameters().get('responderOn') === "true") {
		sap.ui.getCore().attachInit(function() {
			sap.ui.require([
				"com/sap/build/axians/novofermMobil/localService/mockserver",
				"sap/m/Shell",
				"sap/ui/core/ComponentContainer"
			], function(server, Shell, ComponentContainer) {
				// set up test service for local testing

				server.init();
				// initialize the UI component
				new Shell({
					app: new ComponentContainer({
						id: "idCompCont",
						height: "100%",
						name: "com.sap.build.axians.novofermMobil"
					})
				}).placeAt("content");
			});
		});
	} else {
		sap.ui.getCore().attachInit(function () {
			sap.ui.require([
				"sap/m/Shell",
				"sap/ui/core/ComponentContainer"
			], function (Shell, ComponentContainer) {
				new Shell({
					app: new ComponentContainer({
						id: "idCompCont",
						height: "100%",
						name: "com.sap.build.axians.novofermMobil"
					})
				}).placeAt("content");
			});
		});
	}
};
