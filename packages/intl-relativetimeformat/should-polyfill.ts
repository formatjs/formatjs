export function shouldPolyfill() {
  return typeof Intl === 'undefined' || !('RelativeTimeFormat' in Intl);
}
