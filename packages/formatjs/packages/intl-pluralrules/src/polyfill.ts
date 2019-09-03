import {PluralRules as IntlPluralRules} from './core';

export default function polyfill(PluralRules: typeof IntlPluralRules) {
  if (typeof Intl.PluralRules !== 'undefined') {
    return;
  }
  try {
    Object.defineProperty(Intl, 'PluralRules', {
      value: PluralRules,
      writable: true,
      enumerable: false,
      configurable: true,
    });

    Object.defineProperty(PluralRules, 'supportedLocalesOf', {
      writable: true,
      enumerable: false,
      configurable: true,
    });

    // IE11 does not have Symbol
    if (typeof Symbol !== 'undefined') {
      Object.defineProperty(PluralRules.prototype, Symbol.toStringTag, {
        value: 'Object',
        writable: false,
        enumerable: false,
        configurable: true,
      });
    }

    Object.defineProperty(Intl.PluralRules, 'name', {
      value: 'PluralRules',
      writable: false,
      enumerable: false,
      configurable: true,
    });

    Object.defineProperty(PluralRules.prototype, 'select', {
      writable: true,
      enumerable: false,
      configurable: true,
    });

    Object.defineProperty(PluralRules.prototype, 'resolvedOptions', {
      writable: true,
      enumerable: false,
      configurable: true,
    });

    Object.defineProperty(Intl.PluralRules, 'prototype', {
      writable: false,
      enumerable: false,
      configurable: false,
    });

    // https://github.com/tc39/test262/blob/master/test/intl402/PluralRules/length.js
    Object.defineProperty(PluralRules, 'length', {
      value: 0,
      writable: false,
      enumerable: false,
      configurable: true,
    });
    // This is bc transpilation process sets class properties to anonymous function
    Object.defineProperty(PluralRules.prototype.resolvedOptions, 'name', {
      value: 'resolvedOptions',
    });

    Object.defineProperty(PluralRules.prototype.select, 'name', {
      value: 'select',
    });

    Object.defineProperty(PluralRules.supportedLocalesOf, 'name', {
      value: 'supportedLocalesOf',
    });
  } catch (ex) {
    // Some crashes are due to a bug in JSC on iOS 9. We can safely ignore the error.
    // See https://github.com/formatjs/formatjs/issues/128.
  }
}
