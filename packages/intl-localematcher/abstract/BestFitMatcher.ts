import {BestAvailableLocale} from './BestAvailableLocale'
import {LookupMatcherResult} from './types'
import {UNICODE_EXTENSION_SEQUENCE_REGEX} from './utils'

/**
 * https://tc39.es/ecma402/#sec-bestfitmatcher
 * @param availableLocales
 * @param requestedLocales
 * @param getDefaultLocale
 */
export function BestFitMatcher(
  availableLocales: Set<string>,
  requestedLocales: string[],
  getDefaultLocale: () => string
): LookupMatcherResult {
  const minimizedAvailableLocaleMap = Array.from(availableLocales).reduce(
    (all: Record<string, string>, l) => {
      all[l] = l
      return all
    },
    {}
  )
  const minimizedAvailableLocales: Set<string> = new Set()
  availableLocales.forEach(locale => {
    const minimizedLocale = new (Intl as any).Locale(locale)
      .minimize()
      .toString()

    minimizedAvailableLocaleMap[minimizedLocale] = locale
    minimizedAvailableLocales.add(minimizedLocale)
  })

  let foundLocale: string | undefined
  for (const l of requestedLocales) {
    if (foundLocale) {
      break
    }
    const noExtensionLocale = l.replace(UNICODE_EXTENSION_SEQUENCE_REGEX, '')

    if (availableLocales.has(noExtensionLocale)) {
      foundLocale = noExtensionLocale
      break
    }

    if (minimizedAvailableLocales.has(noExtensionLocale)) {
      foundLocale = noExtensionLocale
      break
    }

    const locale = new (Intl as any).Locale(noExtensionLocale)

    const maximizedRequestedLocale = locale.maximize().toString()
    const minimizedRequestedLocale = locale.minimize().toString()

    // Check minimized locale
    if (minimizedAvailableLocales.has(minimizedRequestedLocale)) {
      foundLocale = minimizedRequestedLocale
      break
    }

    // Lookup algo on maximized locale
    foundLocale = BestAvailableLocale(
      minimizedAvailableLocales,
      maximizedRequestedLocale
    )
  }
  return {
    locale:
      (foundLocale && minimizedAvailableLocaleMap[foundLocale]) ||
      getDefaultLocale(),
  }
}
