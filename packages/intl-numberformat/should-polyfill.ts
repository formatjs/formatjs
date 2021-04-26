/**
 * Check if this is old Node that only supports en
 * @returns
 */
function onlySupportsEn() {
  return (
    (!Intl.NumberFormat as any).polyfilled &&
    !Intl.NumberFormat.supportedLocalesOf(['es']).length
  )
}

/**
 * Check if Intl.NumberFormat is ES2020 compatible.
 * Caveat: we are not checking `toLocaleString`.
 *
 * @public
 * @param unit unit to check
 */
function supportsES2020() {
  try {
    const s = new Intl.NumberFormat('en', {
      style: 'unit',
      unit: 'bit',
      unitDisplay: 'long',
      notation: 'scientific',
    }).format(10000)

    // Check for a plurality bug in environment that uses the older versions of ICU:
    // https://unicode-org.atlassian.net/browse/ICU-13836
    if (s !== '1E4 bits') {
      return false
    }
  } catch (e) {
    return false
  }
  return true
}

export function shouldPolyfill() {
  return (
    typeof Intl === 'undefined' ||
    !('NumberFormat' in Intl) ||
    !supportsES2020() ||
    onlySupportsEn()
  )
}
