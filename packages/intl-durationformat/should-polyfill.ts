export function shouldPolyfill() {
  return typeof Intl === 'undefined' || !('DurationFormat' in Intl)
}
