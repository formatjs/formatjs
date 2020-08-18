/**
 * https://bugs.chromium.org/p/chromium/issues/detail?id=1097432
 */
function hasMissingICUBug() {
  if (Intl.DisplayNames) {
    const regionNames = new Intl.DisplayNames(['en'], {type: 'region'});
    return regionNames.of('CA') === 'CA';
  }
  return false;
}

export function shouldPolyfill() {
  return !Intl.DisplayNames || hasMissingICUBug();
}
