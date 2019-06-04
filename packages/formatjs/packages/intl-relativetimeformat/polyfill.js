var IntlRelativeTimeFormat = require('./dist').default;

if (
  typeof Intl !== 'undefined' &&
  typeof Intl.RelativeTimeFormat === 'undefined'
) {
  Intl.RelativeTimeFormat = IntlRelativeTimeFormat;
}
