'use strict';

module.exports = {
	dist: ['dist'],
	log: ['log'],
	resources: ['resources'],
	testResources: ['test-resources'],
	testResourcesWithoutWebappResources: [
		'test-resources/*',
		"!test-resources/webapp",
		"test-resources/webapp/*",
		"!test-resources/webapp/resources"
	],
	war: ['*.war'],
	NMSMPPackage: []

};
