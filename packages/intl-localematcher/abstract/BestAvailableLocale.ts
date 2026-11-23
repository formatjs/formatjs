import {
  stringLastIndexOf,
  stringSlice,
} from '#packages/intl-localematcher/abstract/intrinsics.js'

const LocaleSet = Set
const setAdd = Function.prototype.call.bind(Set.prototype.add) as (
  set: Set<string>,
  value: string
) => void
const setHas = Function.prototype.call.bind(Set.prototype.has) as (
  set: Set<string>,
  value: string
) => boolean

// Cache for Set conversions to avoid repeated array->Set conversions
const availableLocalesSetCache = new WeakMap<readonly string[], Set<string>>()
const getAvailableLocales = availableLocalesSetCache.get.bind(
  availableLocalesSetCache
)
const setAvailableLocales = availableLocalesSetCache.set.bind(
  availableLocalesSetCache
)

/**
 * https://tc39.es/ecma402/#sec-lookupmatchinglocalebyprefix
 * @param availableLocales
 * @param locale
 */
export function BestAvailableLocale(
  availableLocales: readonly string[],
  locale: string
): string | undefined {
  // ECMA-402 §9.2.3 step 1.d.i: index the dense available locale List once.
  let availableSet = getAvailableLocales(availableLocales)
  if (!availableSet) {
    availableSet = new LocaleSet<string>()
    for (let i = 0; i < availableLocales.length; i++) {
      setAdd(availableSet, availableLocales[i])
    }
    setAvailableLocales(availableLocales, availableSet)
  }

  let candidate = locale
  while (candidate.length) {
    if (setHas(availableSet, candidate)) {
      return candidate
    }
    // ECMA-402 §9.2.3 steps 1.d.ii–iv: truncate at a subtag boundary.
    let pos = stringLastIndexOf(candidate, '-')
    if (pos === -1) {
      return undefined
    }
    while (pos >= 2 && candidate[pos - 2] === '-') {
      pos -= 2
    }
    candidate = stringSlice(candidate, 0, pos)
  }
}
