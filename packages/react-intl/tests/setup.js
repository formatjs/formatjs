if (process.version.startsWith('v12')) {
  delete Intl.NumberFormat
}
require('@formatjs/intl-displaynames/polyfill')
require('@formatjs/intl-displaynames/locale-data/en')
require('@formatjs/intl-numberformat/polyfill')
require('@formatjs/intl-numberformat/locale-data/en')
require('@formatjs/intl-numberformat/locale-data/es')
// add custom jest matchers from jest-dom
require('@testing-library/jest-dom/extend-expect')
