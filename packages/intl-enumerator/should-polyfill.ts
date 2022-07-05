export function shouldPolyfill(): boolean {
  return !('supportedValuesOf' in Intl)
}
