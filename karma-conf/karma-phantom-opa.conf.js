module.exports = function(config) {
	config.set({
		basePath: '../',
		port: 11123,
		colors: true,
		singleRun: true,
		browserNoActivityTimeout: 200000000,
		browserDisconnectTimeout: "120000",
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
			path: 'test-resources/webapp/resources/sap-ui-core.js',
			useMockServer: true
		},

		reporters: ['progress', 'junit'],

		junitReporter: {
			suite: "opa",
			outputDir: "log",
			outputFile: "jenkins-opa-test-results.xml",
			useBrowserName: false
		},

		browsers: ['PhantomJS_custom'],

		phantomjsLauncher: {
			exitOnResourceError: true
		},

		// you can define custom flags
		customLaunchers: {
			PhantomJS_custom: {
				base: 'PhantomJS',
				options: {
					viewportSize: {
						width: 1440,
						height: 900
					},
					settings: {
						webSecurityEnabled: false
					}
				},
				flags: ['--load-images=true', '--debug=false', '--disk-cache=false'],
				debug: true
			}
		}
	});
};
