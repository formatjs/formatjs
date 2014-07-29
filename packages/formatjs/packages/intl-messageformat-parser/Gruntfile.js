'use strict';

module.exports = function (grunt) {
    grunt.initConfig({
        clean: {
            dist: 'dist/'
        },

        bundle_jsnext: {
            dest: 'dist/parser.js',

            options: {
                namespace: 'IntlMessageFormatParser'
            }
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
    grunt.loadNpmTasks('grunt-benchmark');
    grunt.loadNpmTasks('grunt-bundle-jsnext-lib');
    grunt.loadNpmTasks('grunt-peg');

    grunt.registerTask('dist', ['clean:dist', 'peg', 'bundle_jsnext']);
    grunt.registerTask('default', ['dist']);
};
