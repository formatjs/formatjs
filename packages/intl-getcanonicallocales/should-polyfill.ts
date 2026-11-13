export function shouldPolyfill(): boolean {
  if (
    typeof Intl === 'undefined' ||
    typeof (Intl as any).getCanonicalLocales !== 'function'
  ) {
    return true
  }
  try {
    const canonicalize = (Intl as any).getCanonicalLocales
    return (
      // https://bugs.chromium.org/p/v8/issues/detail?id=10682
      canonicalize('und-x-private')[0] !== 'und-x-private' ||
      // ECMA-402 canonicalizes aliases by key; only whole "true" values disappear.
      // https://tc39.es/ecma402/#sec-canonicalizeunicodelocaleid
      canonicalize('en-u-aa-yes')[0] !== 'en-u-aa-yes' ||
      canonicalize('en-u-kn-yes')[0] !== 'en-u-kn'
    )
  } catch {
    return true
  }
}
