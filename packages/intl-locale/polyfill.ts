import {Locale} from './';
if (!('Locale' in Intl)) {
  Object.defineProperty(Intl, 'Locale', {
    value: Locale,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}
