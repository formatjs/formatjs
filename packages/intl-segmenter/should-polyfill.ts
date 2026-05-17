export function shouldPolyfill(): boolean {
  return typeof Intl === 'undefined' || !(Intl as any).Segmenter
}
