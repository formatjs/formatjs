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
                src    : 'tmp/src/*.*',
                dest   : 'lib/'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-bundle-jsnext-lib');

    grunt.registerTask('default', [
        'clean', 'cjs_jsnext', 'copy'
    ]);
};
