// ECMA-402 §8.2.1 requires a callable Intl.Collator.
// https://tc39.es/ecma402/#sec-intl-collator-constructor
export function shouldPolyfill(): boolean {
  return typeof Intl === 'undefined' || typeof Intl.Collator !== 'function'
}
