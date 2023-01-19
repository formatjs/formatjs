export function shouldPolyfill() {
  return !(Intl as any).Segmenter
}
