import {
  arrayFind,
  arrayIndexOf,
  setDataProperty,
} from '#packages/intl-localematcher/abstract/intrinsics.js'
import {BestFitMatcher} from '#packages/intl-localematcher/abstract/BestFitMatcher.js'
import {CanonicalizeUValue} from '#packages/intl-localematcher/abstract/CanonicalizeUValue.js'
import {InsertUnicodeExtensionAndCanonicalize} from '#packages/intl-localematcher/abstract/InsertUnicodeExtensionAndCanonicalize.js'
import {LookupMatcher} from '#packages/intl-localematcher/abstract/LookupMatcher.js'
import {UnicodeExtensionComponents} from '#packages/intl-localematcher/abstract/UnicodeExtensionComponents.js'
import type {
  Keyword,
  LookupMatcherResult,
} from '#packages/intl-localematcher/abstract/types.js'
import {
  createLocaleListSnapshot,
  invariant,
} from '#packages/intl-localematcher/abstract/utils.js'

export interface ResolveLocaleResult {
  locale: string
  dataLocale: string
  [k: string]: any
}

interface LocaleArraySnapshot {
  original: readonly string[]
  snapshot: readonly string[] | undefined
}

const availableLocaleArrays = new WeakMap<Set<string>, LocaleArraySnapshot>()
const getLocaleArray = availableLocaleArrays.get.bind(availableLocaleArrays)
const setLocaleArray = availableLocaleArrays.set.bind(availableLocaleArrays)

const localeApply = Reflect.apply
const localeIsArray = Array.isArray
const localeSetValues = Set.prototype.values
const localeSetSize = Object.getOwnPropertyDescriptor(
  Set.prototype,
  'size'
)!.get!
const localeSetNext = Object.getPrototypeOf(new Set().values()).next
const localeLowerCase = String.prototype.toLowerCase

function localeArray(
  locales: Set<string> | readonly string[],
  bestFit: boolean
): readonly string[] {
  if (localeIsArray(locales)) return locales
  const available = locales as Set<string>
  let cached = getLocaleArray(available)
  if (cached?.original.length !== localeApply(localeSetSize, available, []))
    cached = undefined
  if (cached) {
    const original = cached.original
    let index = 0
    const iterator = localeApply(localeSetValues, available, [])
    for (;;) {
      const next = localeApply(
        localeSetNext,
        iterator,
        []
      ) as IteratorResult<string>
      if (next.done) break
      if (original[index++] !== next.value) {
        cached = undefined
        break
      }
    }
  }
  if (!cached) {
    const original: string[] = []
    const iterator = localeApply(localeSetValues, available, [])
    for (;;) {
      const next = localeApply(
        localeSetNext,
        iterator,
        []
      ) as IteratorResult<string>
      if (next.done) break
      setDataProperty(original, `${original.length}`, next.value)
    }
    cached = {original, snapshot: undefined}
    setLocaleArray(available, cached)
  }
  if (!bestFit) return cached.original
  return (cached.snapshot ??= createLocaleListSnapshot(cached.original))
}

/**
 * https://tc39.es/ecma402/#sec-resolvelocale
 */
export function ResolveLocale<K extends string, D extends {[k in K]: any}>(
  availableLocales: Set<string> | readonly string[],
  requestedLocales: readonly string[],
  options: {
    localeMatcher: string
    [k: string]: string | null | undefined
  },
  relevantExtensionKeys: K[],
  localeData: Record<string, D | undefined>,
  getDefaultLocale: () => string
): ResolveLocaleResult {
  const matcher = options.localeMatcher
  let r: LookupMatcherResult
  if (matcher === 'lookup') {
    r = LookupMatcher(
      localeArray(availableLocales, false),
      requestedLocales,
      getDefaultLocale
    )
  } else {
    r = BestFitMatcher(
      localeArray(availableLocales, true),
      requestedLocales,
      getDefaultLocale
    )
  }
  if (r == null) {
    r = {
      locale: getDefaultLocale(),
      extension: '',
    }
  }
  let foundLocale = r.locale
  let foundLocaleData = localeData[foundLocale]
  // TODO: We can't really guarantee that the locale data is available
  // invariant(
  //   foundLocaleData !== undefined,
  //   `Missing locale data for ${foundLocale}`
  // )
  // ECMA-402 §9.2.7, step 8: this is an internal Record, not an object
  // whose fields can invoke setters inherited from Object.prototype.
  // https://tc39.es/ecma402/#sec-resolvelocale
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L242
  const result = {__proto__: null} as unknown as ResolveLocaleResult
  result.locale = 'en'
  result.dataLocale = foundLocale
  let components
  let keywords: Keyword[]
  if (r.extension) {
    components = UnicodeExtensionComponents(r.extension)
    keywords = components.keywords
  } else {
    keywords = []
  }
  let supportedKeywords: Keyword[] = []
  // ECMA-402 §9.2.7 step13: relevant keys are a private List.
  for (let keyIndex = 0; keyIndex < relevantExtensionKeys.length; keyIndex++) {
    const key = relevantExtensionKeys[keyIndex]
    // TODO: Shouldn't default to empty array, see TODO above
    let keyLocaleData: Array<string | null> = foundLocaleData?.[key] ?? []
    invariant(
      localeIsArray(keyLocaleData),
      `keyLocaleData for ${key} must be an array`
    )
    let value = keyLocaleData[0]
    // ECMA-402 §9.2.7 ResolveLocale, step 13.d: null is a valid default.
    // https://tc39.es/ecma402/#sec-resolvelocale
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L254
    invariant(
      value == null || typeof value === 'string',
      `value must be a string, null, or undefined`
    )
    let supportedKeyword: Keyword | undefined
    let entry = arrayFind(keywords, k => k.key === key)
    if (entry) {
      let requestedValue = entry.value
      if (requestedValue !== '') {
        if (arrayIndexOf(keyLocaleData, requestedValue) > -1) {
          value = requestedValue
          supportedKeyword = {
            key,
            value,
          }
        }
      } else if (arrayIndexOf(keyLocaleData, 'true') > -1) {
        value = 'true'
        supportedKeyword = {
          key,
          value,
        }
      }
    }

    let optionsValue = options[key]
    invariant(
      optionsValue == null || typeof optionsValue === 'string',
      `optionsValue must be a string or undefined`
    )
    if (typeof optionsValue === 'string') {
      let ukey = localeApply(localeLowerCase, key, []) as string
      optionsValue = CanonicalizeUValue(ukey, optionsValue)
      if (optionsValue === '') {
        optionsValue = 'true'
      }
    }
    if (
      optionsValue !== undefined &&
      optionsValue !== value &&
      arrayIndexOf(keyLocaleData, optionsValue) > -1
    ) {
      value = optionsValue
      supportedKeyword = undefined
    }
    if (supportedKeyword) {
      setDataProperty(
        supportedKeywords,
        `${supportedKeywords.length}`,
        supportedKeyword
      )
    }
    result[key] = value
  }
  let supportedAttributes: string[] = []
  if (supportedKeywords.length > 0) {
    supportedAttributes = []
    foundLocale = InsertUnicodeExtensionAndCanonicalize(
      foundLocale,
      supportedAttributes,
      supportedKeywords
    )
  }

  result.locale = foundLocale
  return result
}
