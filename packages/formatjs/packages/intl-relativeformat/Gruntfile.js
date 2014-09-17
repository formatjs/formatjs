module.exports = function (grunt) {

    var libpath = require('path');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            dist: 'dist/',
            lib : 'lib/',
            tmp : 'tmp/'
        },

        copy: {
            tmp: {
                expand : true,
                flatten: true,
                src    : ['tmp/src/*.js'],
                dest   : 'lib/'
            }
        },

        concat: {
            dist_with_locales: {
                src: ['dist/intl-relativeformat.js', 'dist/locale-data/*.js'],
                dest: 'dist/intl-relativeformat-with-locales.js'
            }
        },

        jshint: {
            all: ['index.js', 'src/*.js', '!src/en.js', 'tests/*.js']
        },

        extract_cldr_data: {
            options: {
                fields : ['second', 'minute', 'hour', 'day', 'month', 'year'],
                plurals: true
            },

            src_en: {
                dest: 'src/en.js',

                options: {
                    locales: ['en'],
                    prelude: '// GENERATED FILE\n',

                    wrapEntry: function (entry) {
                        return 'export default ' + entry + ';';
                    }
                }
            },

            lib_all: {
                dest: 'lib/locales.js',

                options: {
                    prelude: [
                        '// GENERATED FILE',
                        'var IntlRelativeFormat = require("./core").default;\n\n'
                    ].join('\n'),

                    wrapEntry: function (entry) {
                        return 'IntlRelativeFormat.__addLocaleData(' + entry + ');';
                    }
                }
            },

            dist_all: {
                dest: 'dist/locale-data/',

                options: {
                    wrapEntry: function (entry) {
                        return 'IntlRelativeFormat.__addLocaleData(' + entry + ');';
                    }
                }
            }
        },

        bundle_jsnext: {
            dest: 'dist/intl-relativeformat.js',
            options: {
                namespace: 'IntlRelativeFormat'
            }
        },

        cjs_jsnext: {
            dest: 'tmp/'
        },

        uglify: {
            dist: {
                options: {
                    preserveComments: 'some'
                },

                files: {
                    'dist/intl-relativeformat.min.js': [
                        'dist/intl-relativeformat.js'
                    ],
                    'dist/intl-relativeformat-with-locales.min.js': [
                        'dist/intl-relativeformat-with-locales.js'
                    ]
                }
            }
        },

        benchmark: {
            construct: {
                src: ['tests/benchmark/new*.js']
            },
            format: {
                src: ['tests/benchmark/format*.js']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-bundle-jsnext-lib');
    grunt.loadNpmTasks('grunt-benchmark');
    grunt.loadNpmTasks('grunt-extract-cldr-data');

    grunt.registerTask('cldr', ['extract_cldr_data']);

    grunt.registerTask('compile', [
        'jshint',
        'bundle_jsnext',
        'concat:dist_with_locales',
        'uglify:dist',
        'cjs_jsnext',
        'copy:tmp'
    ]);

    grunt.registerTask('default', [
        'clean',
        'cldr',
        'compile'
    ]);
};
