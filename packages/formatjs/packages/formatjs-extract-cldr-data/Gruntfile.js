/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';

module.exports = function (grunt) {
    grunt.initConfig({
        clean: {
            data: 'data/',
            tmp : 'tmp/',
        },

        curl: {
            cldr: {
                src : 'http://unicode.org/Public/cldr/latest/json-full.zip',
                dest: 'tmp/cldr.zip',
            },
        },

        unzip: {
            cldr: {
                src : 'tmp/cldr.zip',
                dest: 'tmp/cldr/',
            },
        },

        copy: {
            cldr_data: {
                expand: true,
                cwd   : 'tmp/cldr/',
                dest  : 'data/',
                src   : [
                    '*-license.*',
                    'main/*/dateFields.json',
                    'supplemental/ordinals.json',
                    'supplemental/plurals.json',
                ]
            },
        },
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-curl');
    grunt.loadNpmTasks('grunt-zip');

    grunt.registerTask('update-cldr-data', [
        'clean',
        'curl',
        'unzip',
        'copy',
    ]);
};
