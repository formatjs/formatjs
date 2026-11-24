import {
  arrayFind,
  arrayIndexOf,
  setDataProperty,
} from '#packages/intl-localematcher/abstract/intrinsics.js'
import {BestAvailableLocale} from '#packages/intl-localematcher/abstract/BestAvailableLocale.js'
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
  localeDescriptorMember,
  scriptlessRegionLocale,
  splitUnicodeExtension,
} from '#packages/intl-localematcher/abstract/utils.js'

export interface ResolveLocaleResult<D = unknown> {
  locale: string
  dataLocale: string
  localeData?: D
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
const localeDescriptor = Object.getOwnPropertyDescriptor
const hostDefaultLocaleKey = Symbol.for('@formatjs/intlHostDefaultLocale')

// ECMA-402 §6.2.3 uses the host's current locale without Unicode extensions.
// Share the value with bundles loaded after the host formatters are replaced.
// https://tc39.es/ecma402/#sec-defaultlocale
function readHostDefaultLocale(): string | undefined {
  const intl = localeDescriptorMember(globalThis, 'Intl') as object | undefined
  if (!intl) return undefined
  let canRetain = false
  try {
    const retained = localeDescriptor(intl, hostDefaultLocaleKey)
    const cached = retained && localeDescriptor(retained, 'value')?.value
    if (typeof cached === 'string') return cached
    canRetain = retained === undefined
  } catch {
    // A partial Intl can reject cache inspection. Probe the host formatters.
  }
  for (const name of ['NumberFormat', 'DateTimeFormat'] as const) {
    try {
      const Constructor = localeDescriptorMember(intl, name) as
        | (new () => object)
        | undefined
      if (
        typeof Constructor !== 'function' ||
        localeDescriptorMember(Constructor, 'polyfilled')
      )
        continue
      const prototype = localeDescriptorMember(Constructor, 'prototype') as
        | object
        | undefined
      if (!prototype) continue
      const resolve = localeDescriptorMember(prototype, 'resolvedOptions')
      if (typeof resolve !== 'function') continue
      // Host resolvedOptions creates the locale as an own data property.
      // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.resolvedoptions
      // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.resolvedoptions
      const resolved = localeApply(resolve, new Constructor(), [])
      const locale = localeDescriptorMember(resolved, 'locale')
      if (typeof locale !== 'string' || !locale) continue
      const tag = splitUnicodeExtension(locale).locale
      try {
        if (canRetain && Object.isExtensible(intl)) {
          Object.defineProperty(intl, hostDefaultLocaleKey, {
            __proto__: null,
            value: tag,
          } as PropertyDescriptor)
        }
      } catch {
        // A failed cache write cannot override the detected host locale.
      }
      return tag
    } catch {
      // A partial host formatter may fail during inspection or construction.
    }
  }
}
const hostDefaultLocale = readHostDefaultLocale()
const hostRegionLocale =
  hostDefaultLocale && scriptlessRegionLocale(hostDefaultLocale)

interface HostLocaleSupport {
  available: readonly string[]
  defaultLocale: string | undefined
  dataLocale: string | undefined
  regionAlias: string | undefined
}

const hostLocaleSupport = new WeakMap<readonly string[], HostLocaleSupport>()
const getHostLocaleSupport = hostLocaleSupport.get.bind(hostLocaleSupport)
const setHostLocaleSupport = hostLocaleSupport.set.bind(hostLocaleSupport)

// ECMA-402 §9.1 includes the host default in each service's available locales.
// A loaded parent can supply its data. Include the scriptless region too.
// https://tc39.es/ecma402/#sec-internal-slots
export function getServiceLocaleList(
  locales: Set<string> | readonly string[],
  bestFit: boolean
): HostLocaleSupport {
  const available = getAvailableLocaleList(locales, bestFit)
  const cacheable = !localeIsArray(locales)
  const cached = cacheable && getHostLocaleSupport(available)
  if (cached) return cached
  const dataLocale =
    hostDefaultLocale && BestAvailableLocale(available, hostDefaultLocale)
  const aliases: string[] = []
  if (hostDefaultLocale && dataLocale && dataLocale !== hostDefaultLocale)
    setDataProperty(aliases, 0, hostDefaultLocale)
  const regionAlias =
    dataLocale &&
    hostRegionLocale &&
    arrayIndexOf(available, hostRegionLocale) < 0
      ? hostRegionLocale
      : undefined
  if (regionAlias) setDataProperty(aliases, aliases.length, regionAlias)
  const support = {
    available: aliases.length
      ? createLocaleListSnapshot(available, aliases)
      : available,
    defaultLocale: dataLocale ? hostDefaultLocale : undefined,
    dataLocale,
    regionAlias,
  }
  if (cacheable) setHostLocaleSupport(available, support)
  return support
}

export function getAvailableLocaleList(
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
  localeData: Record<string, D | undefined> | undefined,
  getDefaultLocale: () => string,
  mode:
    | 'includeLocaleData'
    | 'hostDefaultWithLocaleData'
    | undefined = undefined
): ResolveLocaleResult<D> {
  // ECMA-402 §9.2.7 steps 1–4: match requests or use the default locale.
  // https://tc39.es/ecma402/#sec-resolvelocale
  const matcher = options.localeMatcher
  const hostSupport =
    mode === 'hostDefaultWithLocaleData'
      ? getServiceLocaleList(availableLocales, matcher !== 'lookup')
      : undefined
  const available =
    hostSupport?.available ??
    getAvailableLocaleList(availableLocales, matcher !== 'lookup')
  const hostLocale = hostSupport?.defaultLocale
  const defaultLocale = hostLocale ? () => hostLocale : getDefaultLocale
  let r: LookupMatcherResult
  if (matcher === 'lookup') {
    r = LookupMatcher(available, requestedLocales, defaultLocale)
  } else {
    r = BestFitMatcher(available, requestedLocales, defaultLocale)
  }
  if (r == null) {
    r = {
      locale: defaultLocale(),
      extension: '',
    }
  }
  let foundLocale = r.locale
  // Steps 5–7 create a private Record and select the locale data once.
  const result = {__proto__: null} as unknown as ResolveLocaleResult<D>
  const dataLocale =
    foundLocale === hostLocale || foundLocale === hostSupport?.regionAlias
      ? (hostSupport?.dataLocale ?? foundLocale)
      : foundLocale
  const foundLocaleData = localeData?.[dataLocale]
  result.dataLocale = dataLocale
  // Keep the exported helper's original result shape for six-argument callers.
  if (mode) result.localeData = foundLocaleData
  // Steps 8–10 gather requested Unicode extension fields.
  let components
  let keywords: Keyword[]
  if (r.extension) {
    components = UnicodeExtensionComponents(r.extension)
    keywords = components.keywords
  } else {
    keywords = []
  }
  let supportedKeywords: Keyword[] = []
  // ECMA-402 §9.2.7 step 11 visits the relevant extension keys.
  for (let keyIndex = 0; keyIndex < relevantExtensionKeys.length; keyIndex++) {
    const key = relevantExtensionKeys[keyIndex]
    // TODO: Shouldn't default to empty array, see TODO above
    let keyLocaleData: Array<string | null> = foundLocaleData?.[key] ?? []
    invariant(
      localeIsArray(keyLocaleData),
      `keyLocaleData for ${key} must be an array`
    )
    let value = keyLocaleData[0]
    // ECMA-402 §9.2.7 steps 11.c–d select the locale default, which may be null.
    // https://tc39.es/ecma402/#sec-resolvelocale
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

    // Steps 11.h–k let a differing supported option override a retained keyword.
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
  // Steps 12–14 canonicalize the retained extension and return the record.
  if (supportedKeywords.length > 0) {
    foundLocale = InsertUnicodeExtensionAndCanonicalize(
      foundLocale,
      [],
      supportedKeywords
    )
  }

  result.locale = foundLocale
  return result
}
