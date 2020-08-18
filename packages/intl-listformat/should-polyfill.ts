export function shouldPolyfill() {
  return typeof Intl === 'undefined' || !('ListFormat' in Intl);
}
