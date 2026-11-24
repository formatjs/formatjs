// ECMA-402 §8.2.10 requires a callable Intl.Segmenter.
// https://tc39.es/ecma402/#sec-intl-segmenter-constructor
export function shouldPolyfill(): boolean {
  return typeof Intl === 'undefined' || typeof Intl.Segmenter !== 'function'
}
