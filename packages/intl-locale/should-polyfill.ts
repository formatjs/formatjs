export function shouldPolyfill() {
  return (
    typeof Intl === 'undefined' ||
    !('Locale' in Intl) ||
    // https://bugs.chromium.org/p/v8/issues/detail?id=10682
    new (Intl as any).Locale('und-x-private').toString() === 'x-private'
  );
}
