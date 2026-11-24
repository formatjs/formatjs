// ECMA-402 §8.3.2 requires a callable Intl.supportedValuesOf.
// https://tc39.es/ecma402/#sec-intl.supportedvaluesof
export function shouldPolyfill(): boolean {
  return (
    typeof Intl === 'undefined' || typeof Intl.supportedValuesOf !== 'function'
  )
}
