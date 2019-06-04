var IntlRelativeTimeFormat = require('./dist/intl-relativetimeformat').default;

if (
  typeof Intl !== 'undefined' &&
  typeof Intl.RelativeTimeFormat === 'undefined'
) {
  Intl.RelativeTimeFormat = IntlRelativeTimeFormat;
}
