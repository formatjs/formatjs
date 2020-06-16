import {DateTimeFormat} from '.';
import {defineProperty} from '@formatjs/intl-utils';

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
}
