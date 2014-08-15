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
                src    : 'tmp/src/*.*',
                dest   : 'lib/'
            }
        },

        jshint: {
            src: 'src/*.js'
        },

        bundle_jsnext: {
            dest: 'dist/mixin.js',

            options: {
                namespace: 'ReactIntlMixin'
            }
        },

        cjs_jsnext: {
            dest: 'tmp/'
        },

        uglify: {
            dist: {
                src : 'dist/mixin.js',
                dest: 'dist/mixin.min.js',

                options: {
                    preserveComments: 'some'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-bundle-jsnext-lib');

    grunt.registerTask('default', [
        'jshint', 'clean', 'bundle_jsnext', 'uglify', 'cjs_jsnext', 'copy:tmp'
    ]);
};
