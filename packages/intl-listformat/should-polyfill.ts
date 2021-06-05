export function shouldPolyfill() {
  return !('ListFormat' in Intl)
}
