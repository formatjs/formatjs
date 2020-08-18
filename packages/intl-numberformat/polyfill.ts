import {
  NumberFormat,
  toLocaleString as _toLocaleString,
  NumberFormatOptions,
} from './';
import {defineProperty} from '@formatjs/intl-utils';
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
