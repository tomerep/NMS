'use strict';

module.exports = {
	options: {
		baseUrl: "http://s00-nexus.global.fum/nexus/content/repositories",
		repository: "maven3repo"
	},

	customSAPUI5Ugly: {
		dependencies: {
		   "sapui5-runtime-mobile": ["<%= pkg.customSAPUI5Version %>"]
		},
		options: {
		   groupId: "<%= pkg.customSAPUI5GroupId %>",
		   classifier: "resources",
		   extension: ".zip",
		   destination: "resources"
		}
	 },
	 
	 customSAPUI5Dbg: {
		dependencies: {
		   "sapui5-runtime-mobile-dbg": ["<%= pkg.customSAPUI5Version %>"]
		},
		options: {
		   groupId: "<%= pkg.customSAPUI5GroupId %>",
		   classifier: "resources",
		   extension: ".zip",
		   destination: "resources"
		}
	 }	 

};
