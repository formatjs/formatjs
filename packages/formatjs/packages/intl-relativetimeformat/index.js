/* jshint node:true */

'use strict';

var IntlRelativeTimeFormat = require('./dist/intl-relativetimeformat-with-locales');

// Re-export `IntlRelativeTimeFormat` as the CommonJS default exports with all the
// locale data registered, and with English set as the default locale. Define
// the `default` prop for use with other compiled ES6 Modules.
exports = module.exports = IntlRelativeTimeFormat;
exports['default'] = exports;
