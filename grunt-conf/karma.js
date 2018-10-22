'use strict';

module.exports = {
	qunit: {
		configFile: 'karma-conf/karma-qunit.conf.js',
		client: {
			qunit: {
				showUI: false,
				autostart: false,
				autoload: false
			},
			openui5: {
				config: {
					theme: 'sap_bluecrystal',
					libs: 'sap.m',
					preload: 'sync',
					animation: 'false',
					resourceroots: {
						'sap.m': '/base/test-resources/webapp/resources/sap/m',
						'sap.ui.layout': '/base/test-resources/webapp/resources/sap/ui/layout',
						'sap.ui': '/base/test-resources/webapp/resources/sap/ui',
						'test': '/base/test-resources/webapp/test',
						'com.sap.build.axians.novofermMobil': '/base/test-resources/webapp',
						'com.sap.build.axians.novofermMobil.app': '/base/test-resources/webapp/test/mockServer',
						'com.sap.build.axians.novofermMobil.test': '/base/test-resources/webapp/test',
						'com.sap.build.axians.novofermMobil.test.unit': '/base/test-resources/webapp/test/unit',
						'com.sap.build.axians.novofermMobil.test.unit.model': '/base/test-resources/webapp/test/unit/model'
					},
					themeroots: {
						'sap_bluecrystal': '/base/test-resources/webapp/resources'
					}
				},
				mockserver: {
					config: {
						autoRespond: true
					},
					rootUri: '/data/',
					metadataURL: '/base/test-resources/webapp/localService/metadata.xml',
					mockdataSettings: {
						'sMockdataBaseUrl': '/base/test-resources/webapp/localService/mockdata/',
						'bGenerateMissingMockData': 'true'
					}
				}
			}
		}
	},
	qunitDbg: {
		configFile: 'karma-conf/karma-qunit-debug.conf.js',
		client: {
			qunit: {
				showUI: false,
				autostart: false,
				autoload: false
			},
			openui5: {
				config: {
					theme: 'sap_bluecrystal',
					libs: 'sap.m',
					preload: 'sync',
					animation: 'false',
					resourceroots: {
						'sap.m': '/base/test-resources/webapp/resources/sap/m',
						'sap.ui.layout': '/base/test-resources/webapp/resources/sap/ui/layout',
						'sap.ui': '/base/test-resources/webapp/resources/sap/ui',
						'test': '/base/test-resources/webapp/test',
						'com.sap.build.axians.novofermMobil': '/base/test-resources/webapp',
						'com.sap.build.axians.novofermMobil.app': '/base/test-resources/webapp/test/mockServer',
						'com.sap.build.axians.novofermMobil.test': '/base/test-resources/webapp/test',
						'com.sap.build.axians.novofermMobil.test.unit': '/base/test-resources/webapp/test/unit',
						'com.sap.build.axians.novofermMobil.test.unit.model': '/base/test-resources/webapp/test/unit/model'
					},
					themeroots: {
						'sap_bluecrystal': '/base/test-resources/webapp/resources'
					}
				},
				mockserver: {
					config: {
						autoRespond: true
					},
					rootUri: '/data/',
					metadataURL: '/base/test-resources/webapp/localService/metadata.xml',
					mockdataSettings: {
						'sMockdataBaseUrl': '/base/test-resources/webapp/localService/mockdata/',
						'bGenerateMissingMockData': 'true'
					}
				}
			}
		}
	},
	opa: {
		configFile: 'karma-conf/karma-phantom-opa.conf.js',
		client: {
			qunit: {
				showUI: false,
				autostart: false,
				autoload: false
			},
			openui5: {
				config: {
					theme: 'sap_bluecrystal',
					libs: 'sap.m',
					preload: 'sync',
					animation: 'false',
					resourceroots: {
						'sap.m': '/base/test-resources/webapp/resources/sap/m',
						'sap.ui.layout': '/base/test-resources/webapp/resources/sap/ui/layout',
						'sap.ui': '/base/test-resources/webapp/resources/sap/ui',
						'test': '/base/test-resources/webapp/test',
						'com.sap.build.axians.novofermMobil': '/base/test-resources/webapp',
						'com.sap.build.axians.novofermMobil.app': '/base/test-resources/webapp/test/mockServer',
						'com.sap.build.axians.novofermMobil.test': '/base/test-resources/webapp/test',
						'com.sap.build.axians.novofermMobil.test.unit': '/base/test-resources/webapp/test/unit',
						'com.sap.build.axians.novofermMobil.test.unit.model': '/base/test-resources/webapp/test/unit/model',
						'com.axians.itsolutions.ui5.nmsmp.utils': '/base/test-resources/webapp/resources/com/axians/itsolutions/ui5/nmsmp/utils'
					},
					themeroots: {
						'sap_bluecrystal': '/base/test-resources/webapp/resources'
					}
				},
				mockserver: {
					config: {
						autoRespond: true
					},
					rootUri: '/data/',
					metadataURL: '/base/test-resources/webapp/localService/metadata.xml',
					mockdataSettings: {
						'sMockdataBaseUrl': '/base/test-resources/webapp/localService/mockdata/',
						'bGenerateMissingMockData': 'true'
					}
				}
			}
		}
	},
	opaDbg: {
		configFile: 'karma-conf/karma-phantom-debug-opa.conf.js',
		client: {
			qunit: {
				showUI: false,
				autostart: false,
				autoload: false
			},
			openui5: {
				config: {
					theme: 'sap_bluecrystal',
					libs: 'sap.m',
					preload: 'sync',
					animation: 'false',
					resourceroots: {
						'sap.m': '/base/test-resources/webapp/resources/sap/m',
						'sap.ui.layout': '/base/test-resources/webapp/resources/sap/ui/layout',
						'sap.ui': '/base/test-resources/webapp/resources/sap/ui',
						'test': '/base/test-resources/webapp/test',
						'com.sap.build.axians.novofermMobil': '/base/test-resources/webapp',
						'com.sap.build.axians.novofermMobil.app': '/base/test-resources/webapp/test/mockServer',
						'com.sap.build.axians.novofermMobil.test': '/base/test-resources/webapp/test',
						'com.sap.build.axians.novofermMobil.test.unit': '/base/test-resources/webapp/test/unit',
						'com.sap.build.axians.novofermMobil.test.unit.model': '/base/test-resources/webapp/test/unit/model',
						'com.axians.itsolutions.ui5.nmsmp.utils': '/base/test-resources/webapp/resources/com/axians/itsolutions/ui5/nmsmp/utils'
					},
					themeroots: {
						'sap_bluecrystal': '/base/test-resources/webapp/resources'
					}
				},
				mockserver: {
					config: {
						autoRespond: true
					},
					rootUri: '/data/',
					metadataURL: '/base/test-resources/webapp/localService/metadata.xml',
					mockdataSettings: {
						'sMockdataBaseUrl': '/base/test-resources/webapp/localService/mockdata/',
						'bGenerateMissingMockData': 'true'
					}
				}
			}
		}
	}
};
