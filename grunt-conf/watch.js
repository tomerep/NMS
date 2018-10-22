'use strict';

module.exports = {
	webapp: {
		files: 'webapp/**/*',
		tasks: ["copyAndCleanWatchedWebappFiles"],
		options: {
			nospawn: true
		}
	}

};
