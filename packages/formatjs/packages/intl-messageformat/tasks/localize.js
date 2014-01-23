module.exports = function(grunt) {

    var libpath = require('path'),
        fs = require('fs');

    grunt.registerTask('localize', 'builds localized version of the library', function () {
        var config = grunt.config.data.localize || {},
            library = grunt.file.read('index.js'),
            srcFiles,
            writeCount = 0;

        srcFiles = fs.readdirSync(config.src);
        srcFiles.forEach(function(srcFile) {
            var srcPath = libpath.resolve(config.src, srcFile),
                destPath = libpath.resolve(config.dest, 'intl-messageformat.' + srcFile),
                out = library;
            out += grunt.file.read(srcPath);
            grunt.file.write(destPath, out, {encoding: 'utf8'});
            writeCount++;
        });

        grunt.log.ok('Wrote ' + writeCount + ' files in ' + config.dest);
    });

};
