'use strict';

module.exports = function(grunt) {
	return {
		determineIndexHTMLHead: {
			options: {
				patterns: [{
					match: '<head>',
					replacement: function(sMatch, iPos, sFileContent) {
						grunt.option("actualIndexHTMLHead", sFileContent.substring(iPos, sFileContent.indexOf("\n", iPos)));
						grunt.option("bIndexHTMLContainsHead", true);
						return sMatch;
					}
				}],
				usePrefix: false
			}
		},
		determineIndexHTMLTitle: {
			options: {
				patterns: [{
					match: '<title>',
					replacement: function(sMatch, iPos, sFileContent) {
						grunt.option("actualIndexHTMLTitle", sFileContent.substring(iPos, sFileContent.indexOf("\n", iPos)));
						grunt.option("bIndexHTMLContainsTitle", true);
						return sMatch;
					}
				}],
				usePrefix: false
			}
		},
		indexHTMLTitle: {
			options: {
				patterns: [{}],
				usePrefix: false
			}
		},
		addIndexHTMLTitle: {
			options: {
				patterns: [{}],
				usePrefix: false
			}
		},
		determineSAPUI5Preload: {
			options: {
				patterns: [{
					match: 'data-sap-ui-preload',
					replacement: function(sMatch, iPos, sFileContent) {
						grunt.option("actualSAPUI5Preload", sFileContent.substring(iPos, sFileContent.indexOf("\n", iPos)));
						grunt.option("bIndexHTMLContainsPreload", true);
						return sMatch;
					}
				}],
				usePrefix: false
			}
		},
		SAPUI5Preload: {
			options: {
				patterns: [{
					replacement: 'data-sap-ui-preload="<%= pkg.SAPUI5PreloadVariant %>"'
				}],
				usePrefix: false
			}
		},
		determineSAPUI5Bootstrapping: {
			options: {
				patterns: [{
					match: 'id="sap-ui-bootstrap"',
					replacement: function(sMatch, iPos, sFileContent) {
						grunt.option("actualSAPUI5Bootstrapping", sFileContent.substring(iPos, sFileContent.indexOf("\n", iPos)));
						grunt.option("bIndexHTMLContainsSAPUI5Bootstrapping", true);
						return sMatch;
					}
				}],
				usePrefix: false
			}
		},
		addSAPUI5Preload: {
			options: {
				patterns: [{
					replacement: function(sMatch) {
						return sMatch + '\n\t\t\tdata-sap-ui-preload="' + grunt.config.get("pkg.SAPUI5PreloadVariant") + '"'
					}
				}],
				usePrefix: false
			}
		},
		SAPUI5BootstrappingToDbg: {
			options: {
				patterns: [{
					match: 'src="resources/sap-ui-core.js"',
					replacement: 'src="resources/sap-ui-core-dbg.js"'
				}],
				usePrefix: false
			}
		},
		SAPUI5BootstrappingToNonDbg: {
			options: {
				patterns: [{
					match: 'src="resources/sap-ui-core-dbg.js"',
					replacement: 'src="resources/sap-ui-core.js"'
				}],
				usePrefix: false
			}
		},
		karmaQunitAdapterRemoveRunnerStart: {
			options: {
				patterns: [{
					match: 'runner.start()',
					replacement: '//karmaRunnerReplacement'
				}],
				usePrefix: false
			},
			files: [{
				expand: true,
				flatten: true,
				src: ["node_modules/karma-qunit/lib/adapter.js"],
				dest: "node_modules/karma-qunit/lib/"
			}]
		},
		karmaQunitAdapterAddRunnerStart: {
			options: {
				patterns: [{
					match: '//karmaRunnerReplacement',
					replacement: 'runner.start()'
				}],
				usePrefix: false
			},
			files: [{
				expand: true,
				flatten: true,
				src: ["node_modules/karma-qunit/lib/adapter.js"],
				dest: "node_modules/karma-qunit/lib/"
			}]
		},
		productiveCordovaConfig: {
			options: {
				patterns: [{
					match: 'cordovaAppId',
					replacement: '<%= pkg.productiveCordovaAppId %>'
				}, {
					match: 'cordovaAppVersion',
					replacement: '<%= pkg.version %>'
				}, {
					match: 'cordovaAppName',
					replacement: '<%= pkg.productiveCordovaAppName %>'
				}, {
					match: 'cordovaAppDescription',
					replacement: '<%= pkg.productiveCordovaAppDescription %>'
				}, {
					match: 'cordovaContentSource',
					replacement: '<%= pkg.productiveCordovaContentSource %>'
				}]
			},
			files: []
		},
		qualityCordovaConfig: {
			options: {
				patterns: [{
					match: 'cordovaAppId',
					replacement: '<%= pkg.qualityCordovaAppId %>'
				}, {
					match: 'cordovaAppVersion',
					replacement: '<%= pkg.version %>'
				}, {
					match: 'cordovaAppName',
					replacement: '<%= pkg.qualityCordovaAppName %>'
				}, {
					match: 'cordovaAppDescription',
					replacement: '<%= pkg.qualityCordovaAppDescription %>'
				}, {
					match: 'cordovaContentSource',
					replacement: '<%= pkg.qualityCordovaContentSource %>'
				}]
			},
			files: []
		},
		developmentCordovaConfig: {
			options: {
				patterns: [{
					match: 'cordovaAppId',
					replacement: '<%= pkg.developmentCordovaAppId %>'
				}, {
					match: 'cordovaAppVersion',
					replacement: '<%= pkg.version %>'
				}, {
					match: 'cordovaAppName',
					replacement: '<%= pkg.developmentCordovaAppName %>'
				}, {
					match: 'cordovaAppDescription',
					replacement: '<%= pkg.developmentCordovaAppDescription %>'
				}, {
					match: 'cordovaContentSource',
					replacement: '<%= pkg.developmentCordovaContentSource %>'
				}]
			},
			files: []
		},
		appProfile: {
			options: {
				patterns: [{}, {}, {}]
			},
			files: []
		 },		 
		mockCordovaConfig: {
			options: {
				patterns: [{
					match: 'cordovaAppId',
					replacement: '<%= pkg.mockCordovaAppId %>'
				}, {
					match: 'cordovaAppVersion',
					replacement: '<%= pkg.version %>'
				}, {
					match: 'cordovaAppName',
					replacement: '<%= pkg.mockCordovaAppName %>'
				}, {
					match: 'cordovaAppDescription',
					replacement: '<%= pkg.mockCordovaAppDescription %>'
				}, {
					match: 'cordovaContentSource',
					replacement: '<%= pkg.mockCordovaContentSource %>'
				}]
			},
			files: []
		}
		// ,kapselSDKLoggerPluginFileProvider: {
		// 	options: {
		// 		patterns: [{
		// 			match: 'android:name="android.support.v4.content.FileProvider"',
		// 			replacement: 'android:name="de.fum.wffs.sapui5.cordova.KapselFileProvider"'
		// 		}],
		// 		usePrefix: false
		// 	}
		// },
	}
};
