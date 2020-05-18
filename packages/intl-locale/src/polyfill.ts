import {IntlLocale} from './';
if (!('Locale' in Intl)) {
  Object.defineProperty(Intl, 'Locale', {
    value: IntlLocale,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}
