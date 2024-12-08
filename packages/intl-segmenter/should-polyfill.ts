export function shouldPolyfill(): boolean {
  return !(Intl as any).Segmenter
}
