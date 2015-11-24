'use strict';

module.exports = function (grunt) {
    grunt.initConfig({
        clean: {
            lib: 'lib/',
            tmp: 'tmp/'
        },

        cjs_jsnext: {
            dest: 'tmp/'
        },

        copy: {
            tmp: {
                expand : true,
                flatten: true,
                src    : 'tmp/src/*.js',
                dest   : 'lib/'
            }
        },

        connect: {
            server: {
                options: {
                    base: '.',
                    port: 9999
                }
            }
        },

        'saucelabs-mocha': {
            all: {
                options: {
                    urls: [
                        'http://127.0.0.1:9999/test/setup/browser-unit.html',
                    ],

                    build: process.env.TRAVIS_BUILD_NUMBER,
                    sauceConfig: {
                        'record-video': false,
                        'capture-html': false,
                        'record-screenshots': false,
                        'command-timeout': 60
                    },
                    throttled: 3,
                    browsers: [
                        // Chrome
                        {
                            browserName: 'chrome',
                            platform: 'Windows 10',
                            version: '46'
                        },
                        {
                            browserName: 'chrome',
                            platform: 'Windows 10',
                            version: 'beta'
                        },
                        {
                            browserName: 'chrome',
                            platform: 'Windows 10',
                            version: 'dev'
                        },
                        {
                            browserName: 'internet explorer',
                            platform: 'Windows 7',
                            version: '8'
                        },

                        // Firefox
                        {
                            browserName: 'firefox',
                            platform: 'Windows 10',
                            version: '42'
                        },
                        {
                            browserName: 'firefox',
                            platform: 'Windows 10',
                            version: 'beta'
                        },

                        // IE/Edge
                        {
                            browserName: 'internet explorer',
                            platform: 'Windows 7',
                            version: '9'
                        },
                        {
                            browserName: 'internet explorer',
                            platform: 'Windows 8',
                            version: '10'
                        },
                        {
                            browserName: 'internet explorer',
                            platform: 'Windows 8.1',
                            version: '11'
                        },
                        {
                            browserName: 'MicrosoftEdge',
                            platform: 'Windows 10',
                            version: '20'
                        },

                        // Safari
                        {
                            browserName: 'safari',
                            platform: 'OS X 10.10',
                            version: '8'
                        },
                        {
                            browserName: 'safari',
                            platform: 'OS X 10.11',
                            version: '9'
                        }
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-bundle-jsnext-lib');
    grunt.loadNpmTasks('grunt-saucelabs');

    grunt.registerTask('saucelabs', [
        'connect',
        'saucelabs-mocha'
    ]);

    grunt.registerTask('default', [
        'clean',
        'cjs_jsnext',
        'copy'
    ]);
};
