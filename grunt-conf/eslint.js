'use strict';

module.exports = {
	options: {
		quiet: false
	},
	// Do not lint customSAPUI5 resources, nms-mp-util resources and phantomJS runner script
	target: ["webapp/**/*.js", "!webapp/resources/**/*.js", "!webapp/nmsmp/**/*.js", "!webapp/test/**/*runner.js"]
};
