import ListFormat from '.';
import {shouldPolyfill} from './should-polyfill';
if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'ListFormat', {
    value: ListFormat,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}
