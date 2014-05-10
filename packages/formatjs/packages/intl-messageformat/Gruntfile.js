module.exports = function (grunt) {

    var libpath = require('path');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            all: ['index.js', 'tests/*.js']
        },
        'build-data': {
            dest: 'locale-data'
        },
        localize: {
            src: 'locale-data',
            dest: 'build'
        },
        uglify: {
            options: {
                preserveComments: 'some'
            },
            index: {
                src: 'index.js',
                dest: 'build/intl-messageformat.min.js'
            },
            localized: {
                expand: true,
                flatten: true,
                src: ['build/*.js', '!build/*.min.js'],
                dest: 'build',
                rename: function(dest, src) {
                    var ext = libpath.extname(src),
                        base = libpath.basename(src, ext);
                    return libpath.resolve(dest, base + '.min' + ext);
                }
            }
        }
    });

    grunt.loadTasks('./tasks');

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('cldr', ['build-data']);
    grunt.registerTask('build', ['localize', 'uglify:index', 'uglify:localized']);
    grunt.registerTask('default', ['jshint']);
};
