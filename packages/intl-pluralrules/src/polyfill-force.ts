import {PluralRules} from './core';

Object.defineProperty(Intl, 'PluralRules', {
  value: PluralRules,
  writable: true,
  enumerable: false,
  configurable: true,
});
