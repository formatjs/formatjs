import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {setDataProperty} from '#packages/ecma262-abstract/intrinsics.js'
import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {splitUnicodeExtension} from '#packages/ecma402-abstract/Locale/splitUnicodeExtension.js'
import {defaultContent} from '@formatjs_generated/cldr.supported-locales/default-content.js'

const registrations = new WeakMap<object, Map<string, string>>()
const getRegistrations = registrations.get.bind(registrations)
const setRegistrations = registrations.set.bind(registrations)
const LocaleMap = Map
const apply = Reflect.apply
const add = Set.prototype.add
const getOwner = Map.prototype.get
const setOwner = Map.prototype.set
const forEachOwner = Map.prototype.forEach
const split = String.prototype.split
const slice = String.prototype.slice

// ECMA-402 §§6.2.3 and 9 exclude Unicode extensions from default and available locales.
// https://tc39.es/ecma402/#sec-defaultlocale
// https://tc39.es/ecma402/#locale-and-parameter-negotiation
export function canonicalizeLocaleDataTag(tag: string): string {
  const [locale] = CanonicalizeLocaleList(tag)
  return splitUnicodeExtension(locale).locale
}

// ECMA-402 §9 defines [[AvailableLocales]] over canonical tags. Callers
// canonicalize pack labels before indexing their data.
// ECMA-402 §9.1 [[AvailableLocales]] requires fallback tags, including the
// scriptless language-region tag. Fill missing fallbacks without replacing
// explicitly loaded locale data. Refresh inferred rows owned by a reloaded pack.
// https://tc39.es/ecma402/#sec-internal-slots
export function registerLocaleData<T>(
  locale: string,
  data: T,
  localeData: Record<string, T | undefined>,
  availableLocales: Set<string>
): void {
  let owners = getRegistrations(localeData)
  if (!owners) {
    owners = new LocaleMap()
    setRegistrations(localeData, owners)
  }
  if (apply(getOwner, owners, [locale]) === locale) {
    apply(forEachOwner, owners, [
      (owner: string, tag: string) => {
        if (owner === locale) setDataProperty(localeData, tag, data)
      },
    ])
  }
  apply(setOwner, owners, [locale, locale])
  setDataProperty(localeData, locale, data)
  apply(add, availableLocales, [locale])

  const aliases = HasOwnProperty(defaultContent, locale)
    ? defaultContent[locale]
    : undefined
  for (let index = 0; index < (aliases?.length ?? 0); index++) {
    const tag = aliases![index]
    if (apply(getOwner, owners, [tag]) !== tag) {
      setDataProperty(localeData, tag, data)
      apply(setOwner, owners, [tag, locale])
    }
    apply(add, availableLocales, [tag])
  }
  for (let index = -1; index < (aliases?.length ?? 0); index++) {
    const tag = index === -1 ? locale : aliases![index]
    const owner = apply(getOwner, owners, [tag]) ?? tag
    const selected = localeData[tag]
    const addFallback = (fallback: string) => {
      if (!HasOwnProperty(localeData, fallback)) {
        setDataProperty(localeData, fallback, selected)
        apply(setOwner, owners, [fallback, owner])
      }
      apply(add, availableLocales, [fallback])
    }
    const parts = apply(split, tag, ['-']) as string[]
    const scriptEnd = parts[0].length + 5
    let parent = tag
    // ECMA-402 §§9–9.1 require well-formed fallback tags. Drop extension
    // sequences as a unit so a fallback never ends in a bare singleton.
    // https://tc39.es/ecma402/#sec-internal-slots
    let length = 1
    let end = parts[0].length
    for (; length < parts.length && parts[length].length > 1; length++) {
      end += parts[length].length + 1
    }
    if (length < parts.length) {
      parent = apply(slice, parent, [0, end])
      addFallback(parent)
    }
    for (; length > 1; length--) {
      if (length > 2 && parts[1].length === 4) {
        addFallback(parts[0] + apply(slice, parent, [scriptEnd]))
      }
      parent = apply(slice, parent, [
        0,
        parent.length - parts[length - 1].length - 1,
      ])
      addFallback(parent)
    }
  }
}
