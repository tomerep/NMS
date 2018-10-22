'use strict';

module.exports = {
	downloadAndLinkSAPUI5Schemas: {
		cmd: function(sCustomUI5Version) {
			var sUI5Version = sCustomUI5Version.indexOf("-") !== -1 ?  sCustomUI5Version.substring(0, sCustomUI5Version.indexOf("-")) : sCustomUI5Version;
			return 'node ./node_modules/ui5-schemas/bin/index.js --sdk sapui5 --version ' + sUI5Version + ' --outputDir ./UI5Schemas --debug';
		}
	},

	configureSAPUI5Codecompletion: {
		cmd: function() {
			return 'node ./node_modules/ui5-codecompletion/bin/index.js configure --sourceDir=dist/webapp/resources';
		}
	},

	yarnInstallCheckFilesNoLock: {
		cmd: function() {
			return 'yarn install --check-files --no-lockfile';
		}
	}
};
