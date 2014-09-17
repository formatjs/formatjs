/* jshint node:true */

'use strict';

var IntlRelativeFormat = require('./lib/core').default;

// Add all locale data to `IntlRelativeFormat`;
require('./lib/locales');

// Set the default locale to English.
IntlRelativeFormat.defaultLocale = 'en';

// Re-export `IntlRelativeFormat` as the CommonJS default exports with all the
// locale data registered, and with English set as the default locale. Define
// the `default` prop for use with other compiled ES6 Modules.
exports = module.exports = IntlRelativeFormat;
Object.defineProperty(exports, 'default', {value: exports});
