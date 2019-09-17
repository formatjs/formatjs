import {PluralRules as IntlPluralRules} from './core';

export default function metaFix(PluralRules: typeof IntlPluralRules) {
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

    // https://github.com/tc39/test262/blob/master/test/intl402/PluralRules/length.js
    Object.defineProperty(PluralRules, 'length', {
      value: 0,
      writable: false,
      enumerable: false,
      configurable: true,
    });
  } catch (ex) {
    // Some crashes are due to a bug in JSC on iOS 9. We can safely ignore the error.
    // See https://github.com/formatjs/formatjs/issues/128.
  }
}
