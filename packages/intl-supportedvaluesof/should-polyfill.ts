export function shouldPolyfill(): boolean {
  return typeof Intl === 'undefined' || !('supportedValuesOf' in Intl)
}
