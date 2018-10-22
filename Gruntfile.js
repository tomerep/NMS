'use strict';

var fs = require("fs");

var recursive = require("fs-readdir-recursive");

module.exports = function(grunt) {

	// Read package.json into local variable to distinguish task executions
	var pkg = grunt.file.readJSON("package.json");

	var fs = require('fs');

	// Determine dependency postfix dependent on --target parameter from grunt task invocation
	var sArtifactPostfix = grunt.option('target') === "Dbg" ? "-dbg" : "";

	var oJitConfig = {
		"bumpup": "grunt-bumpup",
		"clean": "grunt-contrib-clean",
		"connect": "grunt-contrib-connect",
		"copy": "grunt-contrib-copy",
		"configureProxies": "grunt-connect-proxy",
		"eslint": "grunt-eslint",
		"exec": "grunt-exec",
		"gitpull": "grunt-git",
		"less": "grunt-contrib-less",
		"mvn": "grunt-mvn-deploy",
		"openui5_connect": "grunt-openui5",
		"openui5_preload": "grunt-openui5",
		"nexusDownloader": "grunt-nexus-downloader",
		"karma": "grunt-karma",
		"qunit": "qunitjs",
		"replace": "grunt-replace",
		"uglify": "grunt-contrib-uglify",
		"unzip": "grunt-zip",
		"watch": "grunt-contrib-watch"
	};

	// Compile plugins JIT
	require("jit-grunt")(grunt, oJitConfig);

	// Load plugin configuration from grunt-conf folder
	grunt.initConfig({
		"pkg": grunt.file.readJSON("package.json"),
		"bumpup": require("./grunt-conf/bumpup.js")(grunt),
		"clean": require("./grunt-conf/clean.js"),
		"connect": require("./grunt-conf/connect.js")(grunt),
		"eslint": require("./grunt-conf/eslint.js"),
		"exec": require("./grunt-conf/exec.js"),
		"gitpull": require("./grunt-conf/gitpull.js"),
		"less": require("./grunt-conf/less.js"),
		"mvn": require("./grunt-conf/mvn.js"),
		"openui5_connect": require("./grunt-conf/openui5_connect.js"),
		"openui5_preload": require("./grunt-conf/openui5_preload.js"),
		"nexusDownloader": require("./grunt-conf/nexusDownloader.js"),
		"karma": require("./grunt-conf/karma.js"),
		"qunit": require("./grunt-conf/qunit.js"),
		"replace": require("./grunt-conf/replace.js")(grunt),
		// Will be filled from prepareClientResources task
		"unzip": {},
		"watch": require("./grunt-conf/watch.js")
	});

	// Start watch webapp events

	// Copies all CRUD changes on webapp folder content to dist/webapp as -dbg source
	grunt.event.on('watch', function(action, filepath) {
		// Add copy config
		grunt.config.merge({
			"copy": require("./grunt-conf/copy.js")(grunt)
		});
		// Ignore temporary linter data from unsaved files
		if (filepath.indexOf("scsslint_tmp") === -1) {
			if (filepath.endsWith(".less")) {
				grunt.task.run("compileLess:dist/webapp/css/");
			} else {
				var aWatchedWebappFileToDist = grunt.config.get("copy.watchedWebappFileToDist.files");
				var aWatchedWebappFileToTestResources = grunt.config.get("copy.watchedWebappFileToTestResources.files");
				var sResultFilePath = filepath.substring(filepath.lastIndexOf("webapp") + "webapp".length, filepath.length);
				sResultFilePath = sResultFilePath.endsWith(".js") ? sResultFilePath.substr(0, sResultFilePath.indexOf(".")) + "-dbg" + sResultFilePath.substr(sResultFilePath.indexOf("."), sResultFilePath.length) : sResultFilePath;
				aWatchedWebappFileToDist.push({
					src: filepath,
					dest: "./dist/webapp" + sResultFilePath
				});
				aWatchedWebappFileToTestResources.push({
					src: filepath,
					dest: "./test-resources/webapp" + sResultFilePath
				});
				grunt.config.set('copy.watchedWebappFileToDist.files', aWatchedWebappFileToDist);
				grunt.config.set('copy.watchedWebappFileToTestResources.files', aWatchedWebappFileToTestResources);
			}
		}
	});

	// Updates a private NMSMP npm package from nexus in node_modules and copies to dist/
	grunt.registerTask("updateNMSMPPackage", "updateNMSMPPackage", function(sPackage, bIsLibrary, sScope) {
		grunt.option('sOutputDirectory', "dist/webapp/");
		var sPackagePath = "node_modules/";
		if (sScope && sScope.length > 0) {
			sPackagePath += sScope + "/";
		} else if (bIsLibrary) {
			sScope = "@nms-mp-libraries";
			sPackagePath += sScope + "/";
		} else {
			sScope = "@nms-mp-components";
			sPackagePath += sScope + "/";
		}
		sPackagePath += sPackage;
		grunt.log.writeln("Updating NMSMP package: " + sPackagePath);
		grunt.config.set("clean.NMSMPPackage", sPackagePath);
		grunt.task.run("clean:NMSMPPackage");
		grunt.task.run("exec:yarnInstallCheckFilesNoLock");
		grunt.task.run("copyNMSMPPackagesToDist:" + sScope);
	});

	grunt.registerTask("copyNMSMPPackagesToDist", "copyNMSMPPackagesToDist", function(sScope) {
		// Add copy and uglify task to initConfig after outputDirectories were determined
		grunt.config.merge({
			"copy": require("./grunt-conf/copy.js")(grunt),
			"uglify": require("./grunt-conf/uglify.js")(grunt)
		});
		grunt.config.requires("copy", "uglify");
		var sScopePath = "node_modules/" + sScope;
		if (grunt.file.isDir(sScopePath)) {
			var oComponentJitConfig = {};
			var oComponentGruntconfig = {};
			var aTasks = [];
			fs.readdirSync(sScopePath).forEach(function(sFile) {
				var sPackagePath = sScopePath + "/" + sFile;
				if (grunt.file.isDir(sPackagePath)) {

					var sTaskName = sFile.split("-").join("");
					oComponentJitConfig[sTaskName] = sPackagePath.substring(sPackagePath.indexOf("/") + 1, sPackagePath.length);

					oComponentGruntconfig[sTaskName] = {
						components: {}
					};
					grunt.option(sTaskName, sPackagePath);
					aTasks.push(sTaskName);
				}
			});

			var oResultGruntConfig = {};
			Object.keys(grunt.config("")).forEach(key => oResultGruntConfig[key] = grunt.config("")[key]);
			Object.keys(oComponentGruntconfig).forEach(key => oResultGruntConfig[key] = oComponentGruntconfig[key]);

			var oResultJitConfig = {};
			Object.keys(oJitConfig).forEach(key => oResultJitConfig[key] = oJitConfig[key]);
			Object.keys(oComponentJitConfig).forEach(key => oResultJitConfig[key] = oComponentJitConfig[key]);

			// Configure JIT
			require("jit-grunt")(grunt, oResultJitConfig);
			grunt.initConfig(oResultGruntConfig);

			for (var i in aTasks) {
				grunt.task.run(aTasks[i]);
			}
		} else {
			grunt.log.writeln("No directory found for: " + sScopePath);
		}
	});

	// Executes copy task and clears file array for next watch task event
	grunt.registerTask("copyAndCleanWatchedWebappFiles", ['copy:watchedWebappFileToDist', 'copy:watchedWebappFileToTestResources', 'clearWatchedWebappFiles']);

	// Clear files from watch event. Invoked after copy task was executed
	grunt.registerTask("clearWatchedWebappFiles", "clearWatchedWebappFiles", function() {
		grunt.config.set('copy.watchedWebappFileToDist.files', []);
		grunt.config.set('copy.watchedWebappFileToTestResources.files', []);
	});

	// Stop watch webapp events

	// Downloads customSAPUI5 and nmsmpUtils dependent on --target="Dbg" was passed to CLI. Download defaults to uglified version.
	// Download tasks are only executed if archives do not exist in resources folder
	grunt.registerTask("downloadClientResources", "downloadClientResources", function(artifactPostfix) {
		var sResultArtifactPostfix = artifactPostfix ? artifactPostfix : sArtifactPostfix;

		grunt.task.run("cleanBrokenClientResources");

		// Download in case of non existing archive
		if (!grunt.file.exists("resources/" + pkg['customSAPUI5ArtifactId'] + sResultArtifactPostfix + "-" + pkg['customSAPUI5Version'] + "-resources.zip") && !grunt.file.exists("resources/" + pkg['customSAPUI5ArtifactId'] + sResultArtifactPostfix + "-" + pkg['customSAPUI5Version'] + ".zip")) {

			grunt.task.run("nexusDownloader:customSAPUI5" + (sResultArtifactPostfix === "-dbg" ? "Dbg" : "Ugly"));
		} else {
			grunt.log.writeln("Skipping download of archive: " + pkg['customSAPUI5ArtifactId'] + sResultArtifactPostfix + "-" + pkg['customSAPUI5Version'] + "-resources.zip");
		}

	});

	// Deletes all aborted artifacts from nexus download (caused by infrastructure timeout)
	grunt.registerTask("cleanBrokenClientResources", "cleanBrokenClientResources", function() {
		var sPath = "resources";
		if (grunt.file.isDir(sPath)) {
			fs.readdirSync(sPath).forEach(function(sFile) {
				var iFileSize = getFileSize(sPath + "/" + sFile);
				if (iFileSize <= 4096) {
					grunt.log.writeln("Found broken nexus download. Deleting file: " + sPath + "/" + sFile);
					grunt.file.delete(sPath + "/" + sFile);
				}
			});
		}
	});

	function getFileSize(sPath) {
		return fs.lstatSync(sPath).size;
	}

	// Will be invoked from reactor after prepareClientResources was successful executed (prior to the cordova platform add call) in case of hasAfterClientTemplatePrepareCallback
	// is set true within package.json. This task can be used to e.g add custom cordova plugins specified within the custom section of
	// plugin-conf/pluginMapping.xml (the output dir must be sPluginRessourcesPath + "/custom/plugins") or
	// to alter Kapsel Plugins before the platform was created.
	grunt.registerTask("afterClientTemplatePrepare", "afterClientTemplatePrepare", function(sCordovaTemplatePath, sPluginResourcesPath) {
		// grunt.config.set("copy.customPlugins.files", [{
		// 	cwd: 'custom-plugins',
		// 	expand: true,
		// 	src: ['**/*'],
		// 	dest: sPluginRessourcesPath + "/custom/plugins"
		// }]);
		// grunt.task.run("copy:customPlugins");
		// grunt.config.set("replace.kapselSDKLoggerPluginFileProvider.files", [{expand: true, flatten: true, src: [sPluginRessourcesPath + "/KapselSDK/plugins/logger/plugin.xml"], dest: sPluginRessourcesPath + "/KapselSDK/plugins/logger/"}]);
		// grunt.task.run("replace:kapselSDKLoggerPluginFileProvider");
	});

	// Will be invoked from reactor after desired cordova platform was successfully added. This task can be used inject additional files into the prepared cordova platform.
	grunt.registerTask("afterCordovaPlatformInitialization", "afterCordovaPlatformInitialization", function(sCordovaPlatform, sCordovaPlatformPath) {
	});

	// Start all clean tasks from grunt-conf/clean.js. Cleans all build sources except node and node_modules
	grunt.registerTask("cleanAll", ["clean:dist", "clean:resources", "clean:war", "clean:testResources", "clean:log"]);

	// Unzips all previously downloaded archives from /resources/ to dist
	grunt.registerTask("unzipClientResources", "unzipClientResources", function(outputDirectory, artifactPostfix) {
		var fDetermineUnzipSourcesConfigAfterNexusDownload = function(artifactPostfix, outputDirectory) {
			var oUnzipFileMappings = {};
			var sPath = "resources";
			artifactPostfix = artifactPostfix ? artifactPostfix : sArtifactPostfix;
			outputDirectory = outputDirectory ? outputDirectory : (grunt.option('sOutputDirectory') || "dist/webapp/");

			fs.readdirSync(sPath).forEach(function(file) {
				var sUri = sPath + '/' + file;
				// Skip artifacts without matching postfix e.g.: "-dbg" for builds executed with --target=Dbg
				if (artifactPostfix && artifactPostfix.length > 0 && file.indexOf(artifactPostfix) <= 0 || artifactPostfix.length === 0 && file.indexOf("-dbg") > 0) {
					console.log("skipping: " + file);
					return;
				}
				// Proceed in case read file is not a directory
				if (!fs.lstatSync(sUri).isDirectory()) {
					// Determine unzip location dependent on case insensitive artifact name and version from package.json.
					if (/sapui5/i.test(file) >= 0 && file.indexOf(pkg['customSAPUI5Version']) >= 0) {
						var sSAPUI5CorePath = outputDirectory + "resources/sap-ui-core" + (grunt.option('target') === "Dbg" ? "-dbg.js" : ".js");
						// Unzip in case sap-ui-core* does not exist in output directory
						console.log("testing: " + sSAPUI5CorePath);
						if (!grunt.file.isFile(sSAPUI5CorePath)) {
							oUnzipFileMappings[outputDirectory + pkg.resourcesOutputDirectory] ? oUnzipFileMappings[outputDirectory + pkg.resourcesOutputDirectory].push(sUri) : oUnzipFileMappings[outputDirectory + pkg.resourcesOutputDirectory] = [sUri];
						} else {
							console.info("skipping unzip (sap-ui-core exists in output directory) clean client dist or reactor templates for updating the custom SAPUI5 version: " + outputDirectory);
						}
					} else {
						console.info("skipping: " + file);
					}
				}
			});
			return oUnzipFileMappings;
		};
		// Configure uninitialized unzip task and execute
		var oData = fDetermineUnzipSourcesConfigAfterNexusDownload(artifactPostfix, outputDirectory);
		if (Object.keys(oData).length > 0) {
			grunt.config.set("unzip", fDetermineUnzipSourcesConfigAfterNexusDownload(artifactPostfix, outputDirectory));
			grunt.task.run("unzip");
		}
	});

	// Wether copy and replace .js files to -dbg.js into dist folder or uglify to dist.
	// If bIsTest is true both version will be copied to sOutputDirectory
	grunt.registerTask("moveWebapp", "moveWebapp", function (bIsTest) {
		grunt.config.requires("copy", "uglify");
		// Copy and uglify client sources for debug and non debug test
		if (bIsTest) {
			grunt.task.run("copy:webapp");
			grunt.task.run("uglify:webapp");
		} else {
			grunt.task.run(grunt.option('target') === "Dbg" ? "copy:webapp" : "uglify:webapp");
		}
		grunt.task.run("copy:webappExceptJS");

		// All node_modules sources, which are used by the resulting client, must be copied before updating the UI5 manifest file
		grunt.task.run("copyClientLibsFromNodeModules");

		// Update manifest.json with previously copied node_module implementations
		grunt.task.run("updateManifest");

		// Add Timestamp to manifest.json version attribute
		grunt.config.set("bumpup.files", [grunt.option('sOutputDirectory') + 'manifest.json']);
		grunt.task.run("bumpup:minor");
	});

	// Cleans, Download and unzip debug or nonDebug client resources(nmsmpUtil / customSAPUI5 from package.json) into default dist directory. In case grunt parameter --target=Dbg was passed,
	// The -dbg artifacts will be downloaded. Task cannot be invoked from reactor due to task signature.
	grunt.registerTask("prepareCleanClientResources", ["clean:dist", "prepareClientResources"]);

	grunt.registerTask("initializeTestClientResources", "initializeTestClientResources", function(bKeepWebappResources) {
		grunt.task.run(bKeepWebappResources ? "clean:testResourcesWithoutWebappResources" : "clean:testResources");
		// Switch output directory to test-resources before moveWebapp execution and config merge
		grunt.option('sOutputDirectory', "test-resources/webapp/");
		grunt.option('sAppProfile', "development");
		grunt.config.merge({
			"copy": require("./grunt-conf/copy.js")(grunt),
			"uglify": require("./grunt-conf/uglify.js")(grunt)
		});
		grunt.task.run("moveWebapp:true");
		grunt.task.run("compileLess:" + grunt.option('sOutputDirectory') + "css/");

		grunt.task.run("clean:log");
	});

	grunt.registerTask("prepareTestResources", "prepareTestResources", function() {
		grunt.task.run("initializeTestClientResources");
		// Download and unzip debug sources for both cases (debug / non debug)
		grunt.task.run("downloadClientResources:-dbg");
		grunt.task.run("unzipClientResources:test-resources/webapp/:-dbg");
		grunt.task.run("downloadClientResources");
		grunt.task.run("unzipClientResources:test-resources/webapp/");
	});

	// Execute Unit Tests with utils and custom SAPUI5 dbg and uglified versions from test-resources directory.
	grunt.registerTask("testClient", function () {
		grunt.task.run("prepareTestResources");
		// Download and unzip debug sources for both cases (debug / non debug)
		grunt.task.run("downloadClientResources:-dbg");
		grunt.task.run("unzipClientResources:test-resources/webapp/:-dbg");
		grunt.task.run("downloadClientResources");
		grunt.task.run("unzipClientResources:test-resources/webapp/");
		// replace runner.start() from karma-qunit to solve phantomjs cli issue https://github.com/karma-runner/karma-qunit/issues/27
		grunt.task.run("replace:karmaQunitAdapterRemoveRunnerStart");
		grunt.task.run("karma:opa");
		grunt.task.run("karma:opaDbg");
		grunt.task.run("replace:karmaQunitAdapterAddRunnerStart");
		grunt.task.run("karma:qunit");
		grunt.task.run("karma:qunitDbg");
		grunt.task.run("clean:testResources");
	});

	// Test Client with Chrome and debug sources
	grunt.registerTask("testChromeClient", function () {
		// Initialize test-resource without cleaning the test-resources/webapp/resources/ directory to decrease roundtrips times.
		grunt.task.run("initializeTestClientResources:true");
		grunt.task.run("downloadClientResources:-dbg");
		grunt.task.run("unzipClientResources:test-resources/webapp/:-dbg");
		// replace runner.start() from karma-qunit to solve phantomjs cli issue https://github.com/karma-runner/karma-qunit/issues/27
		grunt.task.run("replace:karmaQunitAdapterRemoveRunnerStart");
		// Switch karma conf to chrome-opa
		grunt.config.set("karma.opaDbg.configFile", "karma-conf/karma-chrome-debug-opa.conf.js");
		grunt.task.run("karma:opaDbg");
		grunt.task.run("replace:karmaQunitAdapterAddRunnerStart");
		grunt.task.run("karma:qunitDbg");
	});

	// Deploy client to maven3repo
	grunt.registerTask("deployClient", "deployClient", function() {
		grunt.task.run("cleanAll");
		grunt.task.run("prepareClientResources:productive:true");
		if (grunt.option("bIsPreload") && grunt.option("bIsPreload") === true) {
			var sArtifactId = pkg.name + "-preload";
			grunt.log.writeln("Configuring preload maven artifactId to: " + sArtifactId);
			// Set maven deployment artifactId from package.json name attribute to preload name
			grunt.config.set("mvn.package.artifactId", sArtifactId);
		}
		grunt.task.run("mvn:release");
		grunt.task.run("cleanAll");
	});

	grunt.registerTask("downloadAndLinkSAPUI5Schemas", "downloadAndLinkSAPUI5Schemas", function() {
		grunt.task.run("exec:downloadAndLinkSAPUI5Schemas:" + pkg.customSAPUI5Version);
	});

	grunt.registerTask("configureSAPUI5Codecompletion", "configureSAPUI5Codecompletion", function() {
		grunt.task.run("exec:configureSAPUI5Codecompletion:" + pkg.resourcesOutputDirectory);
	});

	// Download and unzip debug or nonDebug client resources(nmsmpUtil / customSAPUI5 from package.json). In case grunt parameter --target=Dbg was passed,
	// The -dbg artifacts will be downloaded
	// function parameters are optional. These are used from reactor project
	grunt.registerTask("prepareClientResources", "prepareClientResources", function(sAppProfile, sExecuteTests, sIsCordova, sOutputDirectory, sAdditionalAppParameter) {
		// Default excludes for unit tests. PrepareClientResources won´t be invoked for unit testing
		// so unit test sources can be excluded. The parameter sExecuteTests is deprecated use grunt task testClient instead
		var aAdditionalJSExcludes = ["!test/**/*.js"];
		var aAdditionalNonJSExcludes = ["!test/**", "!test.html"];
		// Set output directories before config merge
		grunt.option('sOutputDirectory', sOutputDirectory ? sOutputDirectory + "www/" : "dist/webapp/");
		grunt.option('sCordovaOutputDirectory', sOutputDirectory);
		// Use development app profile as default in case no parameter was passed
		grunt.option('sAppProfile', sAppProfile === undefined ? "development" : sAppProfile);

		// Set additional excludes for copy task (e.g.: Exclude tests for client distribution)
		// Skip copy of mock data for productive app profile
		if (grunt.option('sAppProfile') === "productive") {
			aAdditionalJSExcludes.push("!localService/**/*.js");
		}
		grunt.option("aCopyWebappAdditionalJSExcludes", aAdditionalJSExcludes);

		if (grunt.option('sAppProfile') === "productive") {
			aAdditionalNonJSExcludes.push("!localService/**")
		}
		grunt.option("aCopyWebappAdditionalNonJSExcludes", aAdditionalNonJSExcludes);

		// Add copy and uglify task to initConfig after outputDirectories were determined
		grunt.config.merge({
			"copy": require("./grunt-conf/copy.js")(grunt),
			"uglify": require("./grunt-conf/uglify.js")(grunt)
		});

		grunt.task.run("moveWebapp");

		// Add NMSMP components and libraries to dist/ output directory
		grunt.task.run("copyNMSMPPackagesToDist:@nms-mp-components:" + grunt.option('sOutputDirectory'));
		grunt.task.run("copyNMSMPPackagesToDist:@nms-mp-libraries:" + grunt.option('sOutputDirectory'));
		grunt.task.run("copyNMSMPPackagesToDist:@nms-mp-proj-components:" + grunt.option('sOutputDirectory'));
		grunt.task.run("copyNMSMPPackagesToDist:@nms-mp-proj-libraries:" + grunt.option('sOutputDirectory'));

		grunt.task.run("compileLess:" + grunt.option('sOutputDirectory') + "css/");
		grunt.task.run("downloadClientResources");
		grunt.task.run("unzipClientResources");

		// Copy cordova configuration files to previously specified output directory
		if (sIsCordova === "true") {
			// Copy cordova configs except config.xml which will be transported via grunt-replace
			// To ensure sAppProfile dependent file replacements
			grunt.task.run("copy:cordovaConfig");
		}

		// Store profile specific attributes for bump and replace tasks
		grunt.option('sCordovaAppId', grunt.config.get("pkg." + grunt.option('sAppProfile') + "CordovaAppId"));
		grunt.option('sCordovaAppName', grunt.config.get("pkg." + grunt.option('sAppProfile') + "CordovaAppName"));
		grunt.option('sCordovaAppDescription', grunt.config.get("pkg." + grunt.option('sAppProfile') + "CordovaAppDescription"));

		grunt.task.run("initializeIndexHTMLReplacement");

		// sAppProfile can be used to e.g.: replace serviceUrl strings from previously moved / copied sources.
		grunt.task.run("replaceAppProfileSpecificFiles:" + grunt.option('sAppProfile') + ":" + sIsCordova);

		if (grunt.option('bIsPreload') && grunt.option('bIsPreload') === true) {
			// Configure and execute preload after dependencies were unpacked to ensure correct library preload
			grunt.task.run("executePreload");
		}

		// Replace SAPUI5 core bootstrapping to -dbg within index.html from sOutputDirectory in case of grunt option --target=Dbg and non preload variant
		if (!grunt.option('bIsPreload') && grunt.option('target') === "Dbg") {
			grunt.log.writeln("Try to replace SAPUI5 Core bootstrapping from index.html to -dbg");
			grunt.config.set("replace.SAPUI5BootstrappingToDbg.files", [{
				expand: true,
				flatten: true,
				src: [grunt.option("sOutputDirectory") + "index.html"],
				dest: grunt.option("sOutputDirectory")
			}]);
			grunt.task.run("replace:SAPUI5BootstrappingToDbg");
		} else {
			grunt.log.writeln("Try to replace SAPUI5 Core bootstrapping from index.html to non -dbg");
			grunt.config.set("replace.SAPUI5BootstrappingToNonDbg.files", [{
				expand: true,
				flatten: true,
				src: [grunt.option("sOutputDirectory") + "index.html"],
				dest: grunt.option("sOutputDirectory")
			}]);
			grunt.task.run("replace:SAPUI5BootstrappingToNonDbg");
		}
	});

	grunt.registerTask("copyClientLibsFromNodeModules", "copyClientLibsFromNodeModules", function() {
		grunt.task.run("copy:es6shim");
		// Add more dependencies.
		// grunt.task.run("copy:foo");
	});

	//Add previously copied client libraries to UI5 manifest file.
	grunt.registerTask("updateManifest", "updateManifest", function () {
		var sDependencyDirectory = grunt.option('sOutputDirectory') ? grunt.option('sOutputDirectory') + "libs/" : 'dist/webapp/libs/';
		var aFiles = grunt.file.expand({
			cwd: sDependencyDirectory
		}, ['**/*.js', '**/*.css']);
		if (aFiles) {
			var manifest = grunt.file.readJSON(grunt.option('sOutputDirectory') + "/manifest.json");
			if (!manifest['sap.ui5'].resources) {
				manifest['sap.ui5'].resources = {};
			}
			manifest['sap.ui5'].resources.js = [];
			manifest['sap.ui5'].resources.css = [];
			aFiles.forEach(function (sFileName) {
				if (sFileName.endsWith(".js")) {
					manifest['sap.ui5'].resources.js.push({"uri": "libs/" + sFileName});
				} else if (sFileName.endsWith(".css")) {
					manifest['sap.ui5'].resources.css.push({"uri": "libs/" + sFileName});
				}
			});
			grunt.file.write(grunt.option('sOutputDirectory') + "/manifest.json", JSON.stringify(manifest, null, 2));
		}
	});

	grunt.registerTask("executePreload", "executePreload", function() {
		if (grunt.option('target') === "Dbg") {
			grunt.log.writeln("Skipping preload due to grunt option target=Dbg");
		} else {

			grunt.log.writeln("Configuring component and library preload build");
			// Use groupId from package.json as preload component prefix (Directory delimiter instead of dots)
			var sComponentPrefix = (pkg && pkg.groupId && pkg.groupId.length > 0) ? pkg.groupId.split(".").join("/") : "";
			// Use customSAPUI5 Version to determine openui5 preload compat Version
			var sSAPUI5PreloadCompatVersion = pkg.customSAPUI5Version ? pkg.customSAPUI5Version.split(".", 2).join(".") : "";

			if (sComponentPrefix) {
				grunt.log.writeln("Setting component preload prefix to: " + sComponentPrefix);
				grunt.config.set("openui5_preload.component.options.resources.prefix", sComponentPrefix);
			} else {
				grunt.log.writeln("Unable to determine preload prefix from package.json groupId attribute");
			}

			grunt.log.writeln("Setting component and library preload output directory to: " + grunt.option('sOutputDirectory'));
			grunt.config.set("openui5_preload.component.options.dest", grunt.option('sOutputDirectory'));
			grunt.config.set("openui5_preload.library.options.dest", grunt.option('sOutputDirectory') + "resources/");
			grunt.config.set("openui5_preload.library.options.resources", grunt.option('sOutputDirectory') + "resources/");

			if (sSAPUI5PreloadCompatVersion && sSAPUI5PreloadCompatVersion.length > 0) {
				grunt.log.writeln("Setting SAPUI5 compat Version to: " + sSAPUI5PreloadCompatVersion);
				grunt.config.set("openui5_preload.component.options.compatVersion", sSAPUI5PreloadCompatVersion);
				grunt.config.set("openui5_preload.library.options.compatVersion", sSAPUI5PreloadCompatVersion);
			} else {
				grunt.log.writeln("Unable to determine SAPUI5 compat version for component and library preload");
			}

			grunt.task.run("openui5_preload:component");
			grunt.task.run("openui5_preload:library");

			grunt.task.run("initializePreloadReplacement");
			grunt.task.run("addOrReplacePreloadBootstrapping");
		}
	});

	grunt.registerTask("initializeIndexHTMLReplacement", "initializeIndexHTMLReplacement", function() {
		// Initialize replacement files for index.html title tag
		grunt.config.set("replace.determineIndexHTMLTitle.files", [{
			expand: true,
			flatten: true,
			src: [grunt.option("sOutputDirectory") + "index.html"],
			dest: grunt.option("sOutputDirectory")
		}]);
		grunt.config.set("replace.determineIndexHTMLHead.files", [{
			expand: true,
			flatten: true,
			src: [grunt.option("sOutputDirectory") + "index.html"],
			dest: grunt.option("sOutputDirectory")
		}]);
		grunt.config.set("replace.indexHTMLTitle.files", [{
			expand: true,
			flatten: true,
			src: [grunt.option("sOutputDirectory") + "index.html"],
			dest: grunt.option("sOutputDirectory")
		}]);
		grunt.config.set("replace.indexHTMLTitle.options.patterns.0.replacement", '<title>' + grunt.config.get("pkg." + grunt.option('sAppProfile') + "CordovaAppName") + " " + grunt.config.get("pkg.version") + '</title>');
		grunt.config.set("replace.addIndexHTMLTitle.files", [{
			expand: true,
			flatten: true,
			src: [grunt.option("sOutputDirectory") + "index.html"],
			dest: grunt.option("sOutputDirectory")
		}]);
		grunt.config.set("replace.addIndexHTMLTitle.options.patterns.0.replacement", function(sMatch) {
			return sMatch + '\n\t<title>' + grunt.config.get("pkg." + grunt.option('sAppProfile') + "CordovaAppName") + " " + grunt.config.get("pkg.version") + '</title>'
		});
		// Determine if index.html already contains a title tag
		grunt.task.run("replace:determineIndexHTMLTitle");
		// Determine if index.html contains head tag to insert title tag as fallback
		grunt.task.run("replace:determineIndexHTMLHead");
	});

	grunt.registerTask("initializePreloadReplacement", "initializePreloadReplacement", function() {
		// Initialize replacement files for preload
		grunt.config.set("replace.determineSAPUI5Bootstrapping.files", [{
			expand: true,
			flatten: true,
			src: [grunt.option("sOutputDirectory") + "index.html"],
			dest: grunt.option("sOutputDirectory")
		}]);
		grunt.config.set("replace.determineSAPUI5Preload.files", [{
			expand: true,
			flatten: true,
			src: [grunt.option("sOutputDirectory") + "index.html"],
			dest: grunt.option("sOutputDirectory")
		}]);
		grunt.config.set("replace.SAPUI5Preload.files", [{
			expand: true,
			flatten: true,
			src: [grunt.option("sOutputDirectory") + "index.html"],
			dest: grunt.option("sOutputDirectory")
		}]);
		grunt.config.set("replace.addSAPUI5Preload.files", [{
			expand: true,
			flatten: true,
			src: [grunt.option("sOutputDirectory") + "index.html"],
			dest: grunt.option("sOutputDirectory")
		}]);
		// Determine if index.html already contains SAPUI5 preload bootstrapping
		grunt.task.run("replace:determineSAPUI5Preload");
		// Determine SAPUI5 core bootstrapping string from index.html
		grunt.task.run("replace:determineSAPUI5Bootstrapping");
	});

	// Replaces the index html title with profile specific arguments. In case the index.html does not contain a title tag, the tag will be inserted after the head tag
	grunt.registerTask("addOrReplaceIndexHTMLTitle", "addOrReplaceIndexHTMLTitle", function() {
		if (grunt.option("bIndexHTMLContainsTitle")) {
			// Add determined match to task
			grunt.config.set("replace.indexHTMLTitle.options.patterns.0.match", grunt.option("actualIndexHTMLTitle"));
			grunt.task.run("replace:indexHTMLTitle");
		} else {
			if (grunt.option("bIndexHTMLContainsHead")) {
				// Add determined match to task
				grunt.config.set("replace.addIndexHTMLTitle.options.patterns.0.match", grunt.option("actualIndexHTMLHead"));
				// Add preload bootstrapping after SAPUI5 core bootstrapping parameters parameters
				grunt.task.run("replace:addIndexHTMLTitle");
			} else {
				grunt.log.writeln("Unable to inject title into index.html")
			}
		}
	});

	grunt.registerTask("addOrReplacePreloadBootstrapping", "addOrReplacePreloadBootstrapping", function() {
		if (grunt.option("bIndexHTMLContainsPreload")) {
			// Add determined match to task
			grunt.config.set("replace.SAPUI5Preload.options.patterns.0.match", grunt.option("actualSAPUI5Preload"));
			grunt.task.run("replace:SAPUI5Preload");
		} else {
			if (grunt.option("bIndexHTMLContainsSAPUI5Bootstrapping")) {
				// Add determined match to task
				grunt.config.set("replace.addSAPUI5Preload.options.patterns.0.match", grunt.option("actualSAPUI5Bootstrapping"));
				// Add preload bootstrapping after SAPUI5 core bootstrapping parameters parameters
				grunt.task.run("replace:addSAPUI5Preload");
			} else {
				grunt.log.writeln("Unable to inject preload bootstrapping into index.html")
			}
		}
	});

	grunt.registerTask("replaceAppProfileSpecificFiles", "replaceAppProfileSpecificFiles", function(sAppProfile, sIsCordova) {
		if (sIsCordova === "true") {
		   grunt.config.set("replace." + sAppProfile + "CordovaConfig.files", [{
			  src: ["cordova-conf/config.xml"],
			  dest: grunt.option('sCordovaOutputDirectory') + "config.xml"
		   }]);
		   grunt.task.run("replace:" + sAppProfile + "CordovaConfig");
		} else {
		   // Replace app profile specific file content which has no cordova context
		   // Files should be excluded from previous copy tasks e.g.: moveWebapp
		}
		grunt.config.set("replace.appProfile.files", [{
		   src:[grunt.option("sOutputDirectory") + "manifest.json"],
		   dest: grunt.option("sOutputDirectory") + "manifest.json"
		}]);
	 
		grunt.config.set("replace.appProfile.options.patterns.0", {
		   match: 'appProfile',
		   replacement: sAppProfile
		});

		grunt.config.set("replace.appProfile.options.patterns.1", {
			match: 'buildDate',
			replacement: grunt.template.today('yyyy-mm-dd HH:MM:ss')
		 });
	 
		const execSync = require('child_process').execSync;
		var commit = execSync('git rev-parse HEAD').toString().trim();
		grunt.config.set("replace.appProfile.options.patterns.2", {
			match: 'commit',
			replacement: commit
		 });
		 grunt.task.run("replace:appProfile");
		grunt.task.run("addOrReplaceIndexHTMLTitle");
	 });		  

	grunt.registerTask("compileLess", "compileLess", function(sOutputDirectory) {
		var aLessFiles = recursive("webapp/res/less");
		var oFiles = {};
		aLessFiles.forEach(function(sFileName) {
			// TODO: include additional less files for compilation
			if (sFileName.indexOf("app.less") !== -1) {
				oFiles[sOutputDirectory + sFileName.replace(".less", ".css")] = "webapp/res/less/" + sFileName;
			}
		});

		if (Object.keys(oFiles).length === 0) {
			grunt.log.writeln("Skipping less compilation no less files included under: " + grunt.option('sOutputDirectory') + "webapp/res/");
		} else {
			grunt.config.set('less.webapp.files', oFiles);
			grunt.task.run("less:webapp");
		}
	});

	// Start local webserver for directory dist/webapp
	grunt.registerTask("connectWebapp", "connectWebapp", function() {
		grunt.task.run("configureProxies:webapp");
		grunt.task.run("openui5_connect:webapp");
	});

};
