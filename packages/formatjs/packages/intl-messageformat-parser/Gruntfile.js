'use strict';

module.exports = function (grunt) {
    grunt.initConfig({
        clean: {
            dist: 'dist/',
            lib : 'lib/',
            tmp : 'tmp/'
        },

        copy: {
            tmp: {
                expand : true,
                flatten: true,
                src    : ['tmp/src/*.js', 'tmp/src/*.map'],
                dest   : 'lib/'
            }
        },

        bundle_jsnext: {
            dest: 'dist/parser.js',

            options: {
                namespace: 'IntlMessageFormatParser'
            }
        },

        cjs_jsnext: {
            dest: 'tmp/'
        },

        benchmark: {
            all: {
                src: ['test/benchmark/*.js']
            }
        },

        peg: {
            parser: {
                src : 'src/parser.pegjs',
                dest: 'src/parser.js',

                options: {
                    wrapper: function (filename, code) {
                        return 'export default ' + code + ';';
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-benchmark');
    grunt.loadNpmTasks('grunt-bundle-jsnext-lib');
    grunt.loadNpmTasks('grunt-peg');

    grunt.registerTask('default', [
        'clean', 'peg', 'bundle_jsnext', 'cjs_jsnext', 'copy'
    ]);
};
