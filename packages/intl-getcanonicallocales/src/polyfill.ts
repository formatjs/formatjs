import {getCanonicalLocales} from './';
if (!('getCanonicalLocales' in Intl)) {
  Object.defineProperty(Intl, 'getCanonicalLocales', {
    value: getCanonicalLocales,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}
