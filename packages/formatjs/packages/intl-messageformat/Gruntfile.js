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

        jshint: {
            all: ['index.js', 'src/*.js', '!src/full.js', 'tests/*.js']
        },

        build_locale_data: {
            dest: 'src/full.js'
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
            all: {
                src: 'dist/intl-messageformat.js',
                dest: 'dist/intl-messageformat.min.js',

                options: {
                    preserveComments: 'some'
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

    grunt.loadTasks('./tasks');

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-bundle-jsnext-lib');
    grunt.loadNpmTasks('grunt-benchmark');

    grunt.registerTask('cldr', ['build_locale_data']);
    grunt.registerTask('default', [
        'jshint', 'clean', 'bundle_jsnext', 'uglify', 'cjs_jsnext', 'copy'
    ]);
};
