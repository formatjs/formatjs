import {PluralRules} from './core';

if (!('PluralRules' in Intl)) {
  Object.defineProperty(Intl, 'PluralRules', {
    value: PluralRules,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}
