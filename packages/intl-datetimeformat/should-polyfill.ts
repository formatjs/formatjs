function supportsDateStyle() {
  try {
    return !!(
      new Intl.DateTimeFormat(undefined, {
        dateStyle: 'short',
      } as any).resolvedOptions() as any
    ).dateStyle
  } catch (e) {
    return false
  }
}

/**
 * https://bugs.chromium.org/p/chromium/issues/detail?id=865351
 */
function hasChromeLt71Bug() {
  try {
    return (
      new Intl.DateTimeFormat('en', {
        hourCycle: 'h11',
        hour: 'numeric',
      } as any).formatToParts(0)[2].type !== 'dayPeriod'
    )
  } catch (e) {
    return false
  }
}

/**
 * Node 14's version of Intl.DateTimeFormat does not throw
 * when dateStyle/timeStyle is used with other options.
 * This was fixed in newer V8 versions
 */
function hasUnthrownDateTimeStyleBug(): boolean {
  try {
    return !!new Intl.DateTimeFormat('en', {
      dateStyle: 'short',
      hour: 'numeric',
    } as any).format(new Date(0))
  } catch (e) {
    return false
  }
}

function supportedLocalesOf(locale?: string | string[]) {
  if (!locale) {
    return true
  }
  const locales = Array.isArray(locale) ? locale : [locale]
  return (
    Intl.DateTimeFormat.supportedLocalesOf(locales).length === locales.length
  )
}

export function shouldPolyfill(locale?: string | string[]) {
  return (
    !('DateTimeFormat' in Intl) ||
    !('formatToParts' in Intl.DateTimeFormat.prototype) ||
    !('formatRange' in Intl.DateTimeFormat.prototype) ||
    hasChromeLt71Bug() ||
    hasUnthrownDateTimeStyleBug() ||
    !supportsDateStyle() ||
    !supportedLocalesOf(locale)
  )
}
