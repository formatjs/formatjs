import {PluralRules} from './core';

if (typeof Intl.PluralRules === 'undefined') {
  Object.defineProperty(Intl, 'PluralRules', {
    value: PluralRules,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}
