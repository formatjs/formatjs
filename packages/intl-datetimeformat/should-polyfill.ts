import {arrayEvery} from '#packages/ecma262-abstract/intrinsics.js'
import {match} from '@formatjs/intl-localematcher'
import {supportedLocales} from '@formatjs_generated/cldr.supported-locales/intl-datetimeformat.js'

function supportsDateStyle() {
  return !!(
    new Intl.DateTimeFormat(undefined, {
      dateStyle: 'short',
    } as any).resolvedOptions() as any
  ).dateStyle
}

function supportsTimeZoneIdentifiers() {
  // ECMA-402 §11.1.2 step 19 accepts and normalizes numeric offsets.
  // https://tc39.es/ecma402/#sec-createdatetimeformat
  // https://tc39.es/ecma402/#sec-formatoffsettimezoneidentifier
  return arrayEvery(
    [['+0530', '+05:30']],
    probe =>
      new Intl.DateTimeFormat('en', {timeZone: probe[0]}).resolvedOptions()
        .timeZone === probe[1]
  )
}

/**
 * https://bugs.chromium.org/p/chromium/issues/detail?id=865351
 */
function hasChromeLt71Bug() {
  return (
    new Intl.DateTimeFormat('en', {
      hourCycle: 'h11',
      hour: 'numeric',
    } as any).formatToParts(0)[2].type !== 'dayPeriod'
  )
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
  } catch {
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

function hasRequiredMethods() {
  const Constructor = Intl.DateTimeFormat
  const prototype = Constructor?.prototype
  // ECMA-402 §11.2.2 and §§11.3.4–11.3.6 require these methods.
  // https://tc39.es/ecma402/#sec-intl.datetimeformat.supportedlocalesof
  // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.formatRange
  // https://tc39.es/ecma402/#sec-Intl.DateTimeFormat.prototype.formatRangeToParts
  // https://tc39.es/ecma402/#sec-Intl.DateTimeFormat.prototype.formatToParts
  return (
    typeof Constructor === 'function' &&
    typeof Constructor.supportedLocalesOf === 'function' &&
    typeof prototype?.formatRange === 'function' &&
    typeof prototype?.formatRangeToParts === 'function' &&
    typeof prototype?.formatToParts === 'function'
  )
}

export function shouldPolyfill(locale = 'en'): string | undefined {
  try {
    if (
      typeof Intl !== 'undefined' &&
      hasRequiredMethods() &&
      !hasChromeLt71Bug() &&
      !hasUnthrownDateTimeStyleBug() &&
      supportsDateStyle() &&
      supportsTimeZoneIdentifiers() &&
      supportedLocalesOf(locale)
    )
      return undefined
  } catch {
    // A partial host can throw even on a valid ECMA-402 probe.
  }
  return locale ? match([locale], supportedLocales, 'en') : undefined
}
