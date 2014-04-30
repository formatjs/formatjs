
// setting up the global requirements of the component
global.Intl = global.Intl || global.IntlPolyfill || require('intl');
global.IntlMessageFormat = require('intl-messageformat');
global.React = require('react');

require('./src/component.js');

module.exports = global.ReactIntlMixin;
