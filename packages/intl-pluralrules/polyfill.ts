import {PluralRules} from './';
import {shouldPolyfill} from './should-polyfill';

if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'PluralRules', {
    value: PluralRules,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}
