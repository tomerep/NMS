'use strict';

// function updateVersionParts(aVersionParts, sReleaseType) {
//     var iVersionPartIndex = ("major" === sReleaseType ? 0 : "minor" === sReleaseType ? 1 : "patch" === sReleaseType ? 2 : 2);
//     aVersionParts[iVersionPartIndex] = (parseFloat(aVersionParts[iVersionPartIndex].split("-")[0]) + 1).toString();
//     return aVersionParts[0] + "." + aVersionParts[1] + "." + aVersionParts[2];
// }

module.exports = function(grunt) {
	return {
		setters: {
			"sap.app": function(oOldObject, sReleaseType, options) {
				// Increments version in case of grunt.option("bIsVersionIncrement") is true
				// if(grunt.option("bIsVersionIncrement")) {
				//     oOldObject.applicationVersion.version = updateVersionParts(oOldObject.applicationVersion.version.split('.'), sReleaseType);
				// }
				// else {
				// Add package.json app version + timestamp in case of e.g.: grunt task prepareClientResources
				oOldObject.applicationVersion.version = grunt.config.get("pkg.version") + "-" + grunt.template.date("HHMMssddmmyyyy");
				// }
				// Set previously determine, profile specific, cordovaAppId
				if (grunt.option('sCordovaAppId')) {
					oOldObject.id = grunt.option('sCordovaAppId');
				} else {
					grunt.log.writeln("Unable to update app profile specific cordovaAppId via bump for manifest.json");
				}
				if (grunt.option('sCordovaAppDescription')) {
					oOldObject.description = grunt.option('sCordovaAppDescription');
				} else {
					grunt.log.writeln("Unable to update app profile specific cordovaAppDescription via bump for manifest.json");
				}
				if (grunt.option('sCordovaAppName')) {
					oOldObject.title = grunt.option('sCordovaAppName') + " " + grunt.config.get("pkg.version");
				} else {
					grunt.log.writeln("Unable to update app profile specific cordovaAppName via bump for manifest.json");
				}

				return oOldObject;
			},
			"hybrid": function(oOldObject, sReleaseType, options) {
				// Increments version in case of grunt.option("bIsVersionIncrement") is true
				// if(grunt.option("bIsVersionIncrement")) {
				//     oOldObject.appversion = updateVersionParts(oOldObject.appversion.split('.'), sReleaseType);
				// }
				// else {
				// Add timestamp in case of e.g.: grunt task prepareClientResources
				oOldObject.applicationVersion.version = grunt.config.get("pkg.version") + "-" + grunt.template.date("HHMMssddmmyyyy");
				// }
				return oOldObject;
			}
		},
		files: []
	}
};
