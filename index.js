/* jshint node:true */
'use strict';

// Expose `React` as a global, because the ReactIntlMixin assumes it's global.
var oldReact = global.React;
global.React = require('react');

// Require the lib with all the locale data preloaded.
var ReactIntl = require('./lib/react-intl');
require('./lib/locales');

// Export the Mixin as the default export for back-compat.
exports = module.exports = ReactIntl.Mixin;

Object.defineProperties(exports, {
    Mixin   : {value: ReactIntl.Mixin},
    Date    : {value: ReactIntl.Date},
    Time    : {value: ReactIntl.Time},
    Relative: {value: ReactIntl.Relative},
    Message : {value: ReactIntl.Message},

    __addLocaleData: {value: ReactIntl.__addLocaleData}
});

// Put back `global.React` to how it was.
if (oldReact) {
    global.React = oldReact;
} else {
    delete global.React;
}
