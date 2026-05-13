export function shouldPolyfill(): boolean {
  return typeof Intl === 'undefined' || !('Collator' in Intl)
}
