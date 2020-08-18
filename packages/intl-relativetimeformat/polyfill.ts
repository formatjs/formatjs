import RelativeTimeFormat from './';
import {shouldPolyfill} from './should-polyfill';
if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'RelativeTimeFormat', {
    value: RelativeTimeFormat,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}
