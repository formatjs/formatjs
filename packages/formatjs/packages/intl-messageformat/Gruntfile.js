module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        copy: {
            tmp: {
                expand: true,
                cwd   : 'tmp/src/',
                src   : ['**/*.js', '**/*.map'],
                dest  : 'lib/'
            }
        },

        concat: {
            dist_with_locales: {
                src: ['dist/intl-messageformat.js', 'dist/locale-data/*.js'],
                dest: 'dist/intl-messageformat-with-locales.js',

                options: {
                    sourceMap: true
                }
            }
        },

        bundle_jsnext: {
            dest: 'dist/intl-messageformat.js',

            options: {
                namespace : 'IntlMessageFormat',
                sourceRoot: 'intl-messageformat/'
            }
        },

        cjs_jsnext: {
            dest: 'tmp/'
        },

        uglify: {
            options: {
                preserveComments        : 'some',
                sourceMap               : true,
                sourceMapRoot           : 'intl-messageformat/',
                sourceMapIncludeSources : true
            },

            dist: {
                options: {
                    sourceMapIn : 'dist/intl-messageformat.js.map'
                },

                files: {
                    'dist/intl-messageformat.min.js': [
                        'dist/intl-messageformat.js'
                    ]
                }
            },

            dist_with_locales: {
                options: {
                    sourceMapIn: 'dist/intl-messageformat-with-locales.js.map'
                },

                files: {
                    'dist/intl-messageformat-with-locales.min.js': [
                        'dist/intl-messageformat-with-locales.js'
                    ]
                }
            }
        },

        json_remove_fields: {
            min_source_maps: {
                options: {
                    fields: ['sourceRoot']
                },

                src: 'dist/*.min.js.map'
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

        browserify: {
            test: {
                src : 'tests/browserify/app.js',
                dest: 'tmp/browserify/app.js'
            }
        },

        'saucelabs-mocha': {
            all: {
                options: {
                    urls: [
                        'http://127.0.0.1:9999/tests/index.html',
                        'http://127.0.0.1:9999/tests/browserify/index.html'
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
                            browserName: 'chrome',
                            platform: 'Windows 7',
                            version: '37'
                        },
                        {
                            browserName: 'firefox',
                            platform: 'Windows 7',
                            version: '32'
                        },
                        {
                            browserName: 'iphone',
                            platform: 'OS X 10.9',
                            version: '7.1'
                        },
                        {
                            browserName: 'android',
                            platform: 'Linux',
                            version: '4.4'
                        },
                        {
                            browserName: 'safari',
                            platform: 'OS X 10.9',
                            version: '7'
                        }
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-bundle-jsnext-lib');
    grunt.loadNpmTasks('grunt-json-remove-fields');
    grunt.loadNpmTasks('grunt-saucelabs');
    grunt.loadNpmTasks('grunt-contrib-connect');

    grunt.registerTask('sauce', [
        'browserify',
        'connect',
        'saucelabs-mocha'
    ]);


    grunt.registerTask('default', [
        'bundle_jsnext',
        'concat:dist_with_locales',
        'uglify',
        'json_remove_fields',
        'cjs_jsnext',
        'copy:tmp'
    ]);
};
