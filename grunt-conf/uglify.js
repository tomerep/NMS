'use strict';

module.exports = function(grunt) {
	var sOutputDirectory = grunt.option('sOutputDirectory') || 'dist/webapp/';
	var aFileMappings = ['**/*.js', "!resources/**/*.js"];
	var aAdditionalJSExcludes = grunt.option("aCopyWebappAdditionalJSExcludes");
	// Add additional excludes to fileMapping if exists
	var aFileMappings = aAdditionalJSExcludes !== undefined ? aFileMappings.concat(aAdditionalJSExcludes) : aFileMappings;

	// Uglified webapp artifacts except resources
	return {
		webapp: {
			files: [{
				cwd: 'webapp',
				expand: true,
				src: aFileMappings,
				dest: sOutputDirectory
			}]
		}
	}
};
