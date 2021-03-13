/**
 * https://bugs.chromium.org/p/chromium/issues/detail?id=1097432
 */
function hasMissingICUBug() {
  const DisplayNames = (Intl as any).DisplayNames
  if (DisplayNames && !DisplayNames.polyfilled) {
    return (
      new DisplayNames(['en'], {
        type: 'region',
      }).of('CA') === 'CA'
    )
  }
  return false
}

/**
 * https://bugs.chromium.org/p/chromium/issues/detail?id=1176979
 */
function hasScriptBug() {
  const DisplayNames = (Intl as any).DisplayNames
  if (DisplayNames && !DisplayNames.polyfilled) {
    return (
      new DisplayNames(['en'], {
        type: 'script',
      }).of('arab') !== 'Arabic'
    )
  }
  return false
}

export function shouldPolyfill() {
  return !(Intl as any).DisplayNames || hasMissingICUBug() || hasScriptBug()
}
