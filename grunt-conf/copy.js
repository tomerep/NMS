'use strict';

// Returns and renames JS files from webapp except sources from dependencies, tests and files which will be dynamically renamed
function getAndRenameJSFiles(grunt) {
	var sOutputDirectory = grunt.option('sOutputDirectory') || 'dist/webapp/';
	var aFileMappings = ['**/*.js'];
	var aAdditionalJSExcludes = grunt.option("aCopyWebappAdditionalJSExcludes");
	// Add additional excludes to fileMapping if exists
	aFileMappings = aAdditionalJSExcludes !== undefined ? aFileMappings.concat(aAdditionalJSExcludes) : aFileMappings;
	return grunt.file.expandMapping(aFileMappings, sOutputDirectory, {
		expand: true,
		cwd: "webapp",
		rename: function(sDestination, sMatchedSrcPath) {
			return sDestination + sMatchedSrcPath.substr(0, sMatchedSrcPath.indexOf(".")) + "-dbg" + sMatchedSrcPath.substr(sMatchedSrcPath.indexOf("."), sMatchedSrcPath.length);
		}
	})
}

// Returns all non JS files from  webapp except sources from dependencies
function getNonJSFiles(grunt) {
	var sOutputDirectory = grunt.option('sOutputDirectory') || 'dist/webapp/';
	var aFileMappings = ['.*', '**/*',"!**/*.js", "!.gitkeep", "!res/**"];
	var aAdditionalNonJSExcludes = grunt.option("aCopyWebappAdditionalNonJSExcludes");
	// Add additional excludes to fileMapping if exists
	aFileMappings = aAdditionalNonJSExcludes !== undefined ? aFileMappings.concat(aAdditionalNonJSExcludes) : aFileMappings;
	return grunt.file.expandMapping(aFileMappings, sOutputDirectory, {
		expand: true,
		cwd: "webapp"
	})
}

// Returns all files from cordova-conf folder
function getCordovaConfigFiles(grunt) {
	return grunt.file.expandMapping(['**/*', "!config.xml"], grunt.option('sCordovaOutputDirectory'), {
		expand: true,
		cwd: "cordova-conf"
	})
}

// Returns all files from cordova-conf folder
function getCordovaConfigFiles(grunt) {
	return grunt.file.expandMapping(['**/*', "!config.xml"], grunt.option('sCordovaOutputDirectory'), {
		expand: true,
		cwd: "cordova-conf"
	})
}

module.exports = function(grunt) {
	return {
		webapp: {
			files: getAndRenameJSFiles(grunt)
		},
		webappExceptJS: {
			files: getNonJSFiles(grunt)
		},
		watchedWebappFileToDist: {
			files: []
		},
		watchedWebappFileToTestResources: {
			files: []
		},
		cordovaConfig: {
			files: getCordovaConfigFiles(grunt)
		},
		es6shim: {
			files: [
				{expand: true, cwd: 'node_modules/es6-shim/', src: ["es6-sham.min.js", "es6-shim.min.js"], dest: grunt.option('sOutputDirectory') + "libs" || 'dist/webapp/libs'}
			]
		},
		NMSMPPackagesToDist: {
			files: [
			]
		}
		// , customPlugins: {
		// 	files: []
		// }
	}

};
