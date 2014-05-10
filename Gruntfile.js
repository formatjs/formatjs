module.exports = function (grunt) {

    var libpath = require('path');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            all: ['src/*.js']
        },
        concat: {
            options: {
                separator: '\n\n',
            },
            dist: {
                src: [
                    'node_modules/intl-messageformat/build/intl-messageformat.complete.js',
                    'src/component.js'
                ],
                dest: 'tmp/react-intl.js',
            },
        },
        wrap: {
            globals: {
                src: ['tmp/react-intl.js'],
                dest: 'dist/react-intl.js',
                options: {
                    seperator: '\n',
                    indent: '    ',
                    wrapper: [
                        "(function (global) {",
                            // content goes here...
                        "})(window);"]
                }
            }
        },
        uglify: {
            options: {
                preserveComments: 'some'
            },
            helpers: {
                src: 'dist/react-intl.js',
                dest: 'dist/react-intl.min.js'
            }
        },
        watch: {
          scripts: {
            files: ['src/*.js'],
            tasks: ['jshint', 'concat', 'wrap', 'uglify'],
            options: {
              spawn: false
            }
          }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-wrap');

    grunt.registerTask('default', ['jshint', 'concat', 'wrap', 'uglify']);
};
