/* jshint node:true */
'use strict';

// Expose `React` as a global, because the ReactIntlMixin assumes it's global.
var oldReact = global.React;
global.React = require('react');

// Add all locale data to `ReactIntlMixin`.
require('./lib/locales');

exports = module.exports = require('./lib/mixin').default;
Object.defineProperty(exports, 'default', {value: exports});

// Put back `global.React` to how it was.
if (oldReact) {
    global.React = oldReact;
} else {
    delete global.React;
}
