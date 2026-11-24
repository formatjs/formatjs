import {getCanonicalLocales} from '@formatjs/intl-getcanonicallocales'
import {registerCanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {getInternalSlotsIfPresent} from '#packages/intl-locale/get_internal_slots.js'
import type {Locale} from '#packages/intl-locale/index.js'

type LocaleBrandReader = (value: object) => string | undefined
type BrandCanonicalizer = typeof getCanonicalLocales & {
  __addLocaleBrandReader?: (read: LocaleBrandReader) => void
  __connectLocaleBrandReaders?: (registry: object) => void
  __getLocaleBrandReaders?: () => readonly LocaleBrandReader[]
  __localeBrandRegistry?: object
  __readLocaleTag?: LocaleBrandReader
}
const defineProperty = Object.defineProperty
const canonicalize = getCanonicalLocales as BrandCanonicalizer
const readLocale: LocaleBrandReader = value => {
  const tag = getInternalSlotsIfPresent(value as Locale)?.locale
  return typeof tag === 'string' ? tag : undefined
}
function knownReaders(): readonly LocaleBrandReader[] {
  return canonicalize.__getLocaleBrandReaders?.() ?? [readLocale]
}
const readRegisteredLocale = canonicalize.__readLocaleTag

export function readLocaleTag(value: object): string | undefined {
  if (readRegisteredLocale) return readRegisteredLocale(value)
  const readers = knownReaders()
  for (let index = 0; index < readers.length; index++) {
    const tag = readers[index](value)
    if (tag !== undefined) return tag
  }
  return undefined
}

// Package setup only. Public Locale/formatter operations use the registered private readers.
export function registerLocaleBrand(
  Constructor: object,
  installingInto?: typeof Intl
): void {
  canonicalize.__addLocaleBrandReader?.(readLocale)
  defineProperty(Constructor, '__getLocaleBrandReaders', {value: knownReaders})
  if (canonicalize.__localeBrandRegistry)
    defineProperty(Constructor, '__localeBrandRegistry', {
      value: canonicalize.__localeBrandRegistry,
    })
  const intl =
    installingInto ?? (typeof Intl === 'undefined' ? undefined : Intl)
  if (!intl) return
  let target = intl.getCanonicalLocales as BrandCanonicalizer | undefined
  if (installingInto && typeof target?.__addLocaleBrandReader !== 'function') {
    // A native canonicalizer cannot inspect this polyfill's private Locale slots.
    defineProperty(intl, 'getCanonicalLocales', {
      value: getCanonicalLocales,
      writable: true,
      configurable: true,
      enumerable: false,
    })
    registerCanonicalizeLocaleList(intl, getCanonicalLocales)
    target = canonicalize
  }
  if (
    target === canonicalize ||
    typeof target?.__addLocaleBrandReader !== 'function'
  )
    return
  if (
    target.__localeBrandRegistry &&
    canonicalize.__connectLocaleBrandReaders
  ) {
    canonicalize.__connectLocaleBrandReaders(target.__localeBrandRegistry)
    return
  }
  const add = target.__addLocaleBrandReader
  const known = knownReaders()
  for (let index = 0; index < known.length; index++) add(known[index])
}
