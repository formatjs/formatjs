import {PluralRules} from './';

if (
  !('PluralRules' in Intl) ||
  new Intl.PluralRules('en', {minimumFractionDigits: 2} as any).select(1) ===
    'one'
) {
  Object.defineProperty(Intl, 'PluralRules', {
    value: PluralRules,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}
