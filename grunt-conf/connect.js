'use strict';

module.exports = function(grunt) {
	return {
		webapp: {
			options: {
				base: "dist/webapp",
				open: {
					target: "http://localhost:9000/index.html?sap-ui-debug=true"
				},
				port: 9000,
				hostname: "localhost",
				keepalive: true,
				middleware: function(connect, options, defaultMiddleware) {
					var proxy = require('grunt-connect-proxy/lib/utils').proxyRequest;
					return [proxy].concat(defaultMiddleware);
				}
			},
			proxies: [{
				context: '/sap',
				host: "<%= pkg.localProxyServiceUrl %>",
				port: 8000,
				https: false,
				changeOrigin: true
			}]
		}
	}

};
