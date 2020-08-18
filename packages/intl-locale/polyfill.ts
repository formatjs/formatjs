import {Locale} from './';
import {shouldPolyfill} from './should-polyfill';
if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'Locale', {
    value: Locale,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}
