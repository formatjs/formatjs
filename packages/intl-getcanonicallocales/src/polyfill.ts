import {getCanonicalLocales} from '.';
if (typeof Intl === 'undefined') {
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'Intl', {
      value: {},
    });
  } else if (typeof global !== 'undefined') {
    Object.defineProperty(global, 'Intl', {
      value: {},
    });
  }
}
if (
  !('getCanonicalLocales' in Intl) ||
  // Native Intl.getCanonicalLocales is just buggy
  ((Intl as any).getCanonicalLocales as typeof getCanonicalLocales)(
    'und-x-private'
  )[0] === 'x-private'
) {
  Object.defineProperty(Intl, 'getCanonicalLocales', {
    value: getCanonicalLocales,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}
