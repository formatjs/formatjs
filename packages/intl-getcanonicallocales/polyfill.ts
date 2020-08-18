import {getCanonicalLocales} from '.';
import {shouldPolyfill} from './should-polyfill';
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
if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'getCanonicalLocales', {
    value: getCanonicalLocales,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}
