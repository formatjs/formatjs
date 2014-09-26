module.exports = function (grunt) {
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
                src: ['dist/intl-messageformat.js', 'dist/locale-data/*.js'],
                dest: 'dist/intl-messageformat-with-locales.js'
            }
        },

        jshint: {
            all: ['index.js', 'src/*.js', '!src/en.js', 'tests/*.js']
        },

        extract_cldr_data: {
            options: {
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
                        'var IntlMessageFormat = require("./core").default;\n\n'
                    ].join('\n'),

                    wrapEntry: function (entry) {
                        return 'IntlMessageFormat.__addLocaleData(' + entry + ');';
                    }
                }
            },

            dist_all: {
                dest: 'dist/locale-data/',
                options: {
                    wrapEntry: function (entry) {
                        return 'IntlMessageFormat.__addLocaleData(' + entry + ');';
                    }
                }
            }
        },

        bundle_jsnext: {
            dest: 'dist/intl-messageformat.js',
            options: {
                namespace: 'IntlMessageFormat'
            }
        },

        cjs_jsnext: {
            dest: 'tmp/'
        },

        uglify: {
            options: {
                preserveComments: 'some'
            },

            dist: {
                options: {
                    sourceMap              : true,
                    sourceMapIn            : 'dist/intl-messageformat.js.map',
                    sourceMapIncludeSources: true
                },

                files: {
                    'dist/intl-messageformat.min.js': [
                        'dist/intl-messageformat.js'
                    ]
                }
            },

            dist_with_locales: {
                files: {
                    'dist/intl-messageformat-with-locales.min.js': [
                        'dist/intl-messageformat-with-locales.js'
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

    grunt.registerTask('default', [
        'jshint',
        'clean',
        'cldr',
        'bundle_jsnext',
        'concat:dist_with_locales',
        'uglify',
        'cjs_jsnext',
        'copy:tmp'
    ]);
};
