// ECMA-402 §8.2.4 requires a callable Intl.DurationFormat.
// https://tc39.es/ecma402/#sec-intl-durationformat-constructor
export function shouldPolyfill(): boolean {
  return (
    typeof Intl === 'undefined' ||
    typeof Reflect.get(Intl, 'DurationFormat') !== 'function'
  )
}
