/**
 * https://tc39.es/ecma402/#sec-bestavailablelocale
 * @param availableLocales
 * @param locale
 */
export function BestAvailableLocale(
  availableLocales: readonly string[],
  locale: string
): string | undefined {
  let candidate = locale
  while (true) {
    if (availableLocales.indexOf(candidate) > -1) {
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
