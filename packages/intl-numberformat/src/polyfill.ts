import {
  NumberFormat,
  toLocaleString as _toLocaleString,
  isUnitSupported,
  NumberFormatOptions,
} from '.';
import {defineProperty} from '@formatjs/intl-utils';

if (!isUnitSupported('bit')) {
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
