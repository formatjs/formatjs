import {DateTimeFormat} from '.';
import {defineProperty} from '@formatjs/intl-utils';
import {DateTimeFormatOptions} from './types';
import {toLocaleString as _toLocaleString} from './to_locale_string';

function supportsDateStyle() {
  return !!(new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
  } as any).resolvedOptions() as any).dateStyle;
}

if (
  !('DateTimeFormat' in Intl) ||
  !('formatToParts' in Intl.DateTimeFormat.prototype) ||
  !supportsDateStyle()
) {
  defineProperty(Intl, 'DateTimeFormat', {value: DateTimeFormat});
  defineProperty(Date.prototype, 'toLocaleString', {
    value: function toLocaleString(
      locales?: string | string[],
      options?: DateTimeFormatOptions
    ) {
      return _toLocaleString(this, locales, options);
    },
  });
}
