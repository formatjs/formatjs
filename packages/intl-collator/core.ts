import {IsUnicodeLocaleIdentifierType} from '#packages/ecma402-abstract/IsUnicodeLocaleIdentifierType.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {
  RangeErrorConstructor,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {CoerceOptionsToObject} from '#packages/ecma402-abstract/CoerceOptionsToObject.js'
import {GetOption} from '#packages/ecma402-abstract/GetOption.js'
import {SupportedLocales} from '#packages/ecma402-abstract/SupportedLocales.js'
import {defineProperty, invariant} from '#packages/ecma402-abstract/utils.js'
import {ResolveLocale} from '@formatjs/intl-localematcher'
import {
  availableCollationLocales,
  collationLocaleData,
} from '@formatjs_generated/cldr.collation/locale-data.js'
import {compareCollatorStrings} from '#packages/intl-collator/compare.js'
import {
  getInternalSlots,
  requireInternalSlots,
} from '#packages/intl-collator/get_internal_slots.js'
import type {
  Collator as CollatorType,
  CollatorConstructor,
  CollatorLocaleData,
  CollatorOptions,
  ResolvedCollatorOptions,
} from '#packages/intl-collator/types.js'

const RESOLVED_OPTIONS_KEYS: Array<keyof ResolvedCollatorOptions> = [
  'locale',
  'usage',
  'sensitivity',
  'ignorePunctuation',
  'collation',
  'numeric',
  'caseFirst',
]

// ECMA-402 Intl.Collator is installed on Intl, so force-polyfill entry points
// need a safe Intl object before they define Intl.Collator.
// https://tc39.es/ecma402/#sec-intl.collator
function ensureIntl() {
  if (typeof Intl === 'undefined') {
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'Intl', {
        value: {},
      })
      // @ts-ignore we don't include @types/node so global isn't a thing
    } else if (typeof global !== 'undefined') {
      // @ts-ignore we don't include @types/node so global isn't a thing
      Object.defineProperty(global, 'Intl', {
        value: {},
      })
    }
  }
}

const createObject = Object.create
const defineOwnProperty = Object.defineProperty

// ECMA-402 §10.2 Constructor inherits Function.prototype.
// https://tc39.es/ecma402/#sec-properties-of-the-intl-collator-constructor
//
// ECMA-402 §10.1.1 steps 1–3: allocate using NewTarget, or the active constructor.
// https://tc39.es/ecma402/#sec-intl.collator
export const Collator: CollatorConstructor = new Proxy(
  function Collator(locales?: string | string[], options?: CollatorOptions) {
    return initializeCollator(
      createObject(Collator.prototype),
      locales,
      options
    )
  } as CollatorConstructor,
  {
    construct(_target, args, newTarget) {
      const prototype = newTarget.prototype
      const receiver = createObject(
        prototype !== null &&
          (typeof prototype === 'object' || typeof prototype === 'function')
          ? prototype
          : Collator.prototype
      )
      return initializeCollator(receiver, args[0], args[1])
    },
  }
)

function initializeCollator(
  receiver: CollatorType,
  locales?: string | string[],
  options?: CollatorOptions
) {
  // Steps 5–11: canonicalize, read usage, then negotiate locale options.
  const requestedLocales = CanonicalizeLocaleList(locales)
  const opts = CoerceOptionsToObject(options)
  const usage = GetOption(opts, 'usage', 'string', ['sort', 'search'], 'sort')
  const localeData = usage === 'search' ? searchLocaleData : Collator.localeData
  const matcher = GetOption(
    opts,
    'localeMatcher',
    'string',
    ['lookup', 'best fit'],
    'best fit'
  )
  const opt = createObject(null)
  opt.localeMatcher = matcher
  const collation = GetOption(opts, 'collation', 'string', undefined, undefined)
  // ResolveOptions step 6.d.ii rejects malformed Unicode types.
  // ECMA-402 §9.2.8 ResolveOptions, step 6.d.ii.
  // https://tc39.es/ecma402/#sec-resolveoptions
  if (collation !== undefined && !IsUnicodeLocaleIdentifierType(collation)) {
    throw new RangeErrorConstructor('Invalid collation')
  }
  if (typeof collation === 'string') {
    opt.co = collation
  }
  // ResolutionOptionDescriptors order: co, kn, kf.
  // https://tc39.es/ecma402/#sec-intl-collator-internal-slots
  const numeric = GetOption(opts, 'numeric', 'boolean', undefined, undefined)
  const caseFirst = GetOption(
    opts,
    'caseFirst',
    'string',
    ['upper', 'lower', 'false'],
    undefined
  )
  if (numeric !== undefined) {
    opt.kn = numeric ? 'true' : 'false'
  }
  if (caseFirst !== undefined) {
    opt.kf = caseFirst
  }

  // ECMA-402 Collator has relevant extension keys "co", "kn", and "kf";
  // ResolveLocale negotiates them against generated locale collation data.
  // https://tc39.es/ecma402/#sec-intl-collator-internal-slots
  const r = ResolveLocale(
    Collator.availableLocales,
    requestedLocales,
    opt,
    relevantExtensionKeys,
    localeData,
    getDefaultLocale,
    'hostDefaultWithLocaleData'
  )
  // ECMA-402 §10.1.1 step 18 uses the record selected during resolution.
  // https://tc39.es/ecma402/#sec-intl.collator
  const resolvedLocaleData = r.localeData
  invariant(!!resolvedLocaleData, `Missing locale data for ${r.dataLocale}`)

  // Steps 19–22: sort defaults to variant. Search and punctuation use locale data.
  const sensitivity = GetOption(
    opts,
    'sensitivity',
    'string',
    ['base', 'accent', 'case', 'variant'],
    usage === 'sort' ? 'variant' : resolvedLocaleData.sensitivity
  )
  const ignorePunctuation = GetOption(
    opts,
    'ignorePunctuation',
    'boolean',
    undefined,
    resolvedLocaleData.ignorePunctuation
  )

  const internalSlots = getInternalSlots(receiver)
  internalSlots.initializedCollator = true
  internalSlots.locale = r.locale
  internalSlots.usage = usage
  internalSlots.collation = r.co == null ? 'default' : r.co
  // Keep the data locale selected by ResolveLocale for CompareStrings.
  // The public locale may be a host alias of the selected data locale.
  // https://tc39.es/ecma402/#sec-intl.collator
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Collation_Type_Fallback
  internalSlots.dataLocale = r.dataLocale
  internalSlots.comparisonCollation =
    usage === 'search'
      ? 'search'
      : (r.co ?? resolvedLocaleData.defaultCollation ?? 'standard')
  internalSlots.numeric = r.kn === 'true'
  // ECMA-402 §10.1.1 step 17 uses the resolved locale's kf value.
  // https://tc39.es/ecma402/#sec-intl.collator
  internalSlots.caseFirst = r.kf || 'false'
  internalSlots.sensitivity = sensitivity
  internalSlots.ignorePunctuation = ignorePunctuation
  return receiver
}

// ECMA-402 §7 applies the standard built-in rules: methods are not constructors.
// https://tc39.es/ecma402/#requirements
// https://tc39.es/ecma262/#sec-ecmascript-standard-built-in-objects
const {supportedLocalesOf} = {
  supportedLocalesOf(
    locales?: string | string[],
    options?: Pick<CollatorOptions, 'localeMatcher'>
  ) {
    // Intl.Collator.supportedLocalesOf delegates to SupportedLocales with the
    // constructor's available locale set.
    // https://tc39.es/ecma402/#sec-intl.collator.supportedlocalesof
    return SupportedLocales(
      Collator.availableLocales,
      CanonicalizeLocaleList(locales),
      options
    )
  },
}
defineProperty(Collator, 'supportedLocalesOf', {value: supportedLocalesOf})

// ECMA-402 §10.3.3: check the receiver's slot and cache the bound function.
// https://tc39.es/ecma402/#sec-intl.collator.prototype.compare
Object.defineProperty(Collator.prototype, 'compare', {
  configurable: true,
  get(this: CollatorType) {
    const internalSlots = requireInternalSlots(this)
    let boundCompare = internalSlots.boundCompare
    if (boundCompare === undefined) {
      // Collator Compare Functions convert both arguments with ToString and
      // then call CompareStrings. The getter caches the bound compare function
      // in the collator internal slots.
      // ECMA-402 §10.3.3.1 Collator Compare Functions, steps 5–6.
      // https://tc39.es/ecma402/#sec-collator-compare-functions
      boundCompare = (x: string, y: string) =>
        compareCollatorStrings(internalSlots, ToString(x), ToString(y))
      defineOwnProperty(boundCompare, 'name', {
        __proto__: null,
        value: '',
      } as PropertyDescriptor)
      internalSlots.boundCompare = boundCompare
    }
    return boundCompare
  },
})

const {resolvedOptions} = {
  resolvedOptions(this: CollatorType): ResolvedCollatorOptions {
    const internalSlots = requireInternalSlots(this)
    const result: Record<string, unknown> = {}
    // ECMA-402 §10.3.2 step 4: create own properties in table order.
    // https://tc39.es/ecma402/#sec-intl.collator.prototype.resolvedoptions
    for (let index = 0; index < RESOLVED_OPTIONS_KEYS.length; index++) {
      const key = RESOLVED_OPTIONS_KEYS[index]
      setDataProperty(result, key, internalSlots[key])
    }
    return result as unknown as ResolvedCollatorOptions
  },
}
defineProperty(Collator.prototype, 'resolvedOptions', {value: resolvedOptions})
// ECMA-402 §10.3 Ordinary prototype inherits Object.prototype and has no instance slots.
// https://tc39.es/ecma402/#sec-properties-of-the-intl-collator-prototype-object
//
// ECMA-402 §10.3.1 https://tc39.es/ecma402/#sec-intl.collator.prototype.constructor
defineProperty(Collator.prototype, 'constructor', {value: Collator})

Collator.availableLocales = new Set(availableCollationLocales)
// ECMA-402 defines these as the Collator relevant extension keys: collation
// ("co"), numeric collation ("kn"), and caseFirst ("kf").
// https://tc39.es/ecma402/#sec-intl-collator-internal-slots
const relevantExtensionKeys = ['co', 'kn', 'kf']
Collator.relevantExtensionKeys = [...relevantExtensionKeys]
function getDefaultLocale(): string {
  return 'en'
}
Collator.getDefaultLocale = getDefaultLocale
// ECMA default collation is null; "default" is the generated comparison sentinel.
// Keeping that sentinel out of keyword support prevents retaining co-default.
// https://tc39.es/ecma402/#sec-intl-collator-internal-slots
Collator.localeData = Object.create(null)
for (const locale of Collator.availableLocales) {
  const metadata =
    collationLocaleData[locale as keyof typeof collationLocaleData]
  Collator.localeData[locale] = {
    ...metadata,
    co: [null, ...metadata.co.filter(value => value !== 'default')],
    kn: [...metadata.kn],
    kf: [...metadata.kf],
  }
}
// ECMA-402 §10.1.1, steps 9–11: search uses distinct locale data.
// Its collation is selected by usage, not a sort-specific co keyword.
// https://tc39.es/ecma402/#sec-intl.collator
const searchLocaleData: Record<string, CollatorLocaleData> = Object.create(null)
for (const locale of Collator.availableLocales) {
  const metadata =
    collationLocaleData[locale as keyof typeof collationLocaleData]
  searchLocaleData[locale] = {
    ...Collator.localeData[locale]!,
    co: [null],
    kf: [...metadata.searchKf],
    ignorePunctuation: metadata.searchIgnorePunctuation,
  }
}
Collator.polyfilled = true

// ECMA-402 §10.2.1: the constructor's prototype property is non-writable.
// https://tc39.es/ecma402/#sec-intl.collator.prototype
Object.defineProperty(Collator, 'prototype', {writable: false})
Object.defineProperty(Collator.supportedLocalesOf, 'length', {value: 1})
Object.defineProperty(
  Object.getOwnPropertyDescriptor(Collator.prototype, 'compare')!.get!,
  'name',
  {value: 'get compare'}
)

try {
  // ECMA-402 §10.3.4 https://tc39.es/ecma402/#sec-intl.collator.prototype-%symbol.tostringtag%
  if (typeof Symbol !== 'undefined') {
    Object.defineProperty(Collator.prototype, Symbol.toStringTag, {
      value: 'Intl.Collator',
      writable: false,
      enumerable: false,
      configurable: true,
    })
  }

  Object.defineProperty(Collator.prototype.constructor, 'length', {
    value: 0,
    writable: false,
    enumerable: false,
    configurable: true,
  })
} catch {}

ensureIntl()
