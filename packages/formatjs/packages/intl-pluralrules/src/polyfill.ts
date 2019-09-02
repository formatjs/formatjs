import {PluralRules as IntlPluralRules} from './core';

export default function polyfill(PluralRules: typeof IntlPluralRules) {
  if (typeof Intl.PluralRules !== 'undefined') {
    return;
  }
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
      value: 'Intl.PluralRules',
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }

  Object.defineProperty(PluralRules.prototype, 'format', {
    writable: true,
    enumerable: false,
    configurable: true,
  });

  Object.defineProperty(PluralRules.prototype, 'formatToParts', {
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

  try {
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
    // This crashes due to a bug in JSC on iOS 9. We can safely ignore the error.
    // See https://github.com/formatjs/formatjs/issues/128.
  }
}
