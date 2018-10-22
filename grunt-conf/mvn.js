'use strict';

module.exports = {
	options: {
		debug: false,
		packaging: "war"
	},
	package: {
		groupId: "<%= pkg.groupId %>",
		version: "<%= pkg.version %>",
		sources: ["dist/**"]
	},
	release: {
		url: "http://s00-nexus.global.fum/nexus/content/repositories/maven3repo",
		id: "maven3repo"
	}

};
