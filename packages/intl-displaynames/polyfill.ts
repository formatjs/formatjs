import {DisplayNames} from '.';
import {shouldPolyfill} from './should-polyfill';

if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'DisplayNames', {
    value: DisplayNames,
    enumerable: false,
    writable: true,
    configurable: true,
  });
}
