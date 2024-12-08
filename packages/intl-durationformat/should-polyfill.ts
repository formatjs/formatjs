export function shouldPolyfill(): boolean {
  return typeof Intl === 'undefined' || !('DurationFormat' in Intl)
}
