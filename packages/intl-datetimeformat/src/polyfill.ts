import {DateTimeFormat} from '.';
import {defineProperty} from '@formatjs/intl-utils';

if (!('DateTimeFormat' in Intl)) {
  defineProperty(Intl, 'DateTimeFormat', {value: DateTimeFormat});
}
