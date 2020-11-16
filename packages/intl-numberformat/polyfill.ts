import {NumberFormat} from './src/core';
import {toLocaleString as _toLocaleString} from './src/to_locale_string';
import {defineProperty, NumberFormatOptions} from '@formatjs/ecma402-abstract';
import {shouldPolyfill} from './should-polyfill';

if (shouldPolyfill()) {
  defineProperty(Intl, 'NumberFormat', {value: NumberFormat});
  defineProperty(Number.prototype, 'toLocaleString', {
    value: function toLocaleString(
      locales?: string | string[],
      options?: NumberFormatOptions
    ) {
      return _toLocaleString(this, locales, options);
    },
  });
}
