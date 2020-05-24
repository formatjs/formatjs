import {getCanonicalLocales} from './';
if (
  !('getCanonicalLocales' in Intl) ||
  // Native Intl.getCanonicalLocales is just buggy
  (Intl as any).getCanonicalLocales('und-x-private') === 'x-private'
) {
  Object.defineProperty(Intl, 'getCanonicalLocales', {
    value: getCanonicalLocales,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}
