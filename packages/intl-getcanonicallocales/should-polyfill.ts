export function shouldPolyfill() {
  return (
    typeof Intl === 'undefined' ||
    !('getCanonicalLocales' in Intl) ||
    // Native Intl.getCanonicalLocales is just buggy
    // https://bugs.chromium.org/p/v8/issues/detail?id=10682
    ((Intl as any).getCanonicalLocales as any)('und-x-private')[0] ===
      'x-private'
  );
}
