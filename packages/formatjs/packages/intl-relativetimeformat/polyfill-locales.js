var IntlRelativeTimeFormat = require('./dist/intl-relativetimeformat-with-locales');

if (
  typeof Intl !== 'undefined' &&
  typeof Intl.RelativeTimeFormat === 'undefined'
) {
  Intl.RelativeTimeFormat = IntlRelativeTimeFormat;
}
