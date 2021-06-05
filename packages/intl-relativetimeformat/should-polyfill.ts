export function shouldPolyfill() {
  return !('RelativeTimeFormat' in Intl)
}
