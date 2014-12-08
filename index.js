/* jshint node:true */
'use strict';

// Expose `React` as a global, because the ReactIntlMixin assumes it's global.
var oldReact = global.React;
global.React = require('react');

// Add all locale data to `ReactIntlMixin`. This module will be ignored when
// bundling for the browser with Browserify/Webpack.
require('./lib/locales');

exports = module.exports = require('./lib/main').default;
Object.defineProperty(exports, 'default', {value: exports});

// Put back `global.React` to how it was.
if (oldReact) {
    global.React = oldReact;
} else {
    delete global.React;
}
