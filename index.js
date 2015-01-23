/* jshint node:true */
'use strict';

// Expose `React` as a global, because the ReactIntlMixin assumes it's global.
var oldReact = global.React;
global.React = require('react');

// Require the lib and add all locale data to `ReactIntl`. This module will be
// ignored when bundling for the browser with Browserify/Webpack.
var ReactIntl = require('./lib/react-intl');
require('./lib/locales');

// Export the Mixin as the default export for back-compat with v1.0.0. This will
// be changed to simply re-exporting `ReactIntl` as the default export in v2.0.
exports = module.exports = ReactIntl.IntlMixin;

// Define non-enumerable expandos for each named export on the default export --
// which is the Mixin for back-compat with v1.0.0.
Object.keys(ReactIntl).forEach(function (namedExport) {
    Object.defineProperty(exports, namedExport, {
        enumerable: true,
        value     : ReactIntl[namedExport]
    });
});

// Put back `global.React` to how it was.
if (oldReact) {
    global.React = oldReact;
} else {
    // IE < 9 will throw when trying to delete something off the global object,
    // `window`, so this does the next best thing as sets it to `undefined`.
    try {
        delete global.React;
    } catch (e) {
        global.React = undefined;
    }
}
