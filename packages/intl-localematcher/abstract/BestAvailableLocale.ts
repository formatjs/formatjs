// Cache for Set conversions to avoid repeated array->Set conversions
const availableLocalesSetCache = new WeakMap<readonly string[], Set<string>>()
const getAvailableLocales = availableLocalesSetCache.get.bind(
  availableLocalesSetCache
)
const setAvailableLocales = availableLocalesSetCache.set.bind(
  availableLocalesSetCache
)

/**
 * https://tc39.es/ecma402/#sec-bestavailablelocale
 * @param availableLocales
 * @param locale
 */
export function BestAvailableLocale(
  availableLocales: readonly string[],
  locale: string
): string | undefined {
  // Fast path: use Set for O(1) lookups instead of O(n) indexOf
  let availableSet = getAvailableLocales(availableLocales)
  if (!availableSet) {
    availableSet = new Set(availableLocales)
    setAvailableLocales(availableLocales, availableSet)
  }

  let candidate = locale
  while (true) {
    if (availableSet.has(candidate)) {
      return candidate
    }
    let pos = candidate.lastIndexOf('-')
    if (!~pos) {
      return undefined
    }
    if (pos >= 2 && candidate[pos - 2] === '-') {
      pos -= 2
    }
    candidate = candidate.slice(0, pos)
  }
}
