/**
 * https://bugs.chromium.org/p/v8/issues/detail?id=10682
 */
function hasIntlGetCanonicalLocalesBug(): boolean {
  try {
    return new (Intl as any).Locale('und-x-private').toString() === 'x-private'
  } catch {
    return true
  }
}

/**
 * Check if Intl.Locale is missing critical methods from the Intl Locale Info proposal.
 * Firefox has an incomplete implementation that lacks getWeekInfo() and other methods.
 * https://github.com/formatjs/formatjs/issues/5112
 * https://bugzilla.mozilla.org/show_bug.cgi?id=1693576
 */
function hasIncompleteLocaleInfo(): boolean {
  try {
    const locale = new (Intl as any).Locale('en-US')
    // Check for getWeekInfo - critical for week calculations (e.g., Luxon's localWeekNumber)
    // This is the most important check as it affects date/time libraries
    if (typeof locale.getWeekInfo !== 'function') {
      return true
    }
    // Also check for other Intl Locale Info methods
    // These are part of the same proposal and often missing together
    if (
      typeof locale.getCalendars !== 'function' ||
      typeof locale.getCollations !== 'function' ||
      typeof locale.getHourCycles !== 'function' ||
      typeof locale.getNumberingSystems !== 'function' ||
      typeof locale.getTimeZones !== 'function' ||
      typeof locale.getTextInfo !== 'function'
    ) {
      return true
    }
    return false
  } catch {
    return true
  }
}

export function shouldPolyfill(): boolean {
  return (
    !('Locale' in Intl) ||
    hasIntlGetCanonicalLocalesBug() ||
    hasIncompleteLocaleInfo()
  )
}
