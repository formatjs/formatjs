import {DateTimeFormat, DateTimeFormatOptions} from './';
import {defineProperty} from '@formatjs/ecma402-abstract';
import {shouldPolyfill} from './should-polyfill';
import {
  toLocaleString as _toLocaleString,
  toLocaleDateString as _toLocaleDateString,
  toLocaleTimeString as _toLocaleTimeString,
} from './src/to_locale_string';

if (shouldPolyfill()) {
  defineProperty(Intl, 'DateTimeFormat', {value: DateTimeFormat});
  defineProperty(Date.prototype, 'toLocaleString', {
    value: function toLocaleString(
      locales?: string | string[],
      options?: DateTimeFormatOptions
    ) {
      return _toLocaleString(this, locales, options);
    },
  });
  defineProperty(Date.prototype, 'toLocaleDateString', {
    value: function toLocaleDateString(
      locales?: string | string[],
      options?: DateTimeFormatOptions
    ) {
      return _toLocaleDateString(this, locales, options);
    },
  });
  defineProperty(Date.prototype, 'toLocaleTimeString', {
    value: function toLocaleTimeString(
      locales?: string | string[],
      options?: DateTimeFormatOptions
    ) {
      return _toLocaleTimeString(this, locales, options);
    },
  });
}
