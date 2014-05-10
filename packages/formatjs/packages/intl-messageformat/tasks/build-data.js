module.exports = function(grunt) {

    var libpath = require('path'),
        cldr;


    function listRootLocales() {
        var roots = {};
        cldr.localeIds.forEach(function(locale) {
            if ('root' === locale) {
                return;
            }
            roots[locale.split('_')[0]] = true;
        });
        return Object.keys(roots);
    }


    // `fn` is a string representation of the function
    function cleanupFunction(fn) {
        // not sure if repeated function name will cause trouble
        fn = fn.replace('function anonymous(', 'function (');

        // parseInt() is expensive given that we already know that the input is a number
        fn = fn.replace('if(typeof n==="string")n=parseInt(n,10);', 'n=Math.floor(n);');

        // js-hint asi
        fn = fn.replace('"\n}', '";\n}');
        // js-hint W018 "Confusing use of '!'" caused by stuff like "!(n===11)"
        fn = fn.replace(/!\((\w+)===(\d+)\)/g, '($1!==$2)');
        // js-hint W018 "Confusing use of '!'" caused by stuff like "!(n%100===11)"
        fn = fn.replace(/!\((\w+)%(\d+)===(\d+)\)/g, '($1%$2!==$3)');

        // keep it neat
        fn = fn.replace(/\n/g, ' ');

        return fn;
    }


    // returns a string which registers the function
    // `fn` is a string representation of the function
    function addLocale(locale, fn) {
        return 'IntlMessageFormat.__addLocaleData({locale:"' + locale + '", messageformat:{pluralFunction:' + fn + '}});';
    }


    // gnerate optimized complete locales
    // `funcs` is an object: keys are locales, values are string representations of the function
    function addComplete(funcs) {
        var unique = {},    // key is stringified function, value is the index in `bodies`
            bodies = [],    // key is function unique ID, value is the function body
            locales = {},   // key is locale, value is index of func to use
            i,
            last,
            lines = [];
        Object.keys(funcs).forEach(function(locale) {
            var fn = funcs[locale];
            if (! unique.hasOwnProperty(fn)) {
                i = Object.keys(unique).length;
                unique[fn] = i;
                bodies[i] = fn;
            }
            locales[locale] = unique[fn];
        });
        lines.push('var IntlMessageFormat = global.IntlMessageFormat;');
        lines.push('var funcs = [');
        i = 0;
        last = bodies.length - 1;
        bodies.forEach(function(fn) {
            lines.push(fn + (i === last ? '' : ','));
            i++;
        });
        lines.push('];');
        Object.keys(funcs).forEach(function(locale) {
            lines.push(addLocale(locale, 'funcs[' + locales[locale] + ']'));
        });
        return '(function(global) {\n' + lines.join('\n') + '\n})(typeof global !== "undefined" ? global : this);';
    }


    grunt.registerTask('build-data', 'rebuilds the locale data', function () {
        var config = grunt.config.data['build-data'] || {},
            roots,
            funcs = {}, // key locale, value function string
            writeCount = 0;

        config.dest = config.dest || 'locale-data';

        try {
            cldr = require('cldr');
        } catch (err) {
            grunt.fatal("`cldr` NPM package not available. please `npm i cldr` and try again");
        }

        grunt.file.mkdir(config.dest);

        roots = listRootLocales(cldr);
        roots.forEach(function(root) {
            var fn,
                path;
            fn = cldr.extractPluralRuleFunction(root);
            fn = fn.toString();
            fn = cleanupFunction(fn);
            funcs[root] = fn;
            path = libpath.resolve(config.dest, root + '.js');
            grunt.file.write(path, addLocale(root, fn), {encoding: 'utf8'});
            writeCount++;
        });

        path = libpath.resolve(config.dest, 'complete.js');
        grunt.file.write(path, addComplete(funcs), {encoding: 'utf8'});
        writeCount++;

        grunt.log.ok('Wrote ' + writeCount + ' files in ' + config.dest);
    });

};
