/**
 * https://bugs.chromium.org/p/chromium/issues/detail?id=1097432
 */
function hasMissingICUBug() {
  if ((Intl as any).DisplayNames) {
    const regionNames = new (Intl as any).DisplayNames(['en'], {
      type: 'region',
    });
    return regionNames.of('CA') === 'CA';
  }
  return false;
}

export function shouldPolyfill() {
  return !(Intl as any).DisplayNames || hasMissingICUBug();
}
