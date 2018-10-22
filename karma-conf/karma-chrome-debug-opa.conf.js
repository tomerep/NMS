module.exports = function(config) {
	config.set({
		basePath: '../',
		port: 11123,
		colors: true,
		singleRun: true,
		browserNoActivityTimeout: 200000000,
		browserDisconnectTimeout: "30000",
		frameworks: ['openui5', 'qunit'],
		files: [{
			pattern: 'test-resources/webapp/**/*',
			served: true,
			included: false,
			watched: false
		}, {
			pattern: 'test-resources/webapp/test/integration/AllJourneys.js',
			served: true,
			included: true,
			watched: false
		}],
		proxies: {
			"/base/webapp/resources/": "/base/test-resources/webapp/resources/",
			"/base/webapp/libs/": "/base/test-resources/webapp/libs/"
		},
		openui5: {
			path: 'test-resources/webapp/resources/sap-ui-core-dbg.js',
			useMockServer: true
		},

		reporters: ['progress'],

		browsers: ['Chrome_with_debugging'],

		phantomjsLauncher: {
			exitOnResourceError: true
		},

		// you can define custom flags
		customLaunchers: {
			Chrome_with_debugging: {
				base: 'Chrome',
				flags: ['--disable-web-security']
			}
		}
	});
};
