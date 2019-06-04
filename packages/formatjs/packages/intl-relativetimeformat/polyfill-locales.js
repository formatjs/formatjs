var IntlRelativeTimeFormat = require('./dist/locales').default;

if (
  typeof Intl !== 'undefined' &&
  typeof Intl.RelativeTimeFormat === 'undefined'
) {
  Intl.RelativeTimeFormat = IntlRelativeTimeFormat;
}
