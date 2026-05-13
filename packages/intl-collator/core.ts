import {OrdinaryHasInstance} from '#packages/ecma262-abstract/OrdinaryHasInstance.js'
import {ToObject} from '#packages/ecma262-abstract/ToObject.js'
import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {GetOption} from '#packages/ecma402-abstract/GetOption.js'
import {SupportedLocales} from '#packages/ecma402-abstract/SupportedLocales.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'
import {ResolveLocale} from '@formatjs/intl-localematcher'
import {
  availableCollationLocales,
  collationLocaleData,
} from '@formatjs_generated/cldr.collation/locale-data.js'
import {compareCollatorStrings} from '#packages/intl-collator/compare.js'
import {getInternalSlots} from '#packages/intl-collator/get_internal_slots.js'
import type {
  Collator as CollatorType,
  CollatorConstructor,
  CollatorLocaleData,
  CollatorOptions,
  IntlCollatorInternal,
  ResolvedCollatorOptions,
} from '#packages/intl-collator/types.js'

const RESOLVED_OPTIONS_KEYS: Array<
  keyof Omit<IntlCollatorInternal, 'boundCompare' | 'initializedCollator'>
> = [
  'locale',
  'usage',
  'sensitivity',
  'ignorePunctuation',
  'collation',
  'numeric',
  'caseFirst',
]

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

export const Collator = function (
  this: CollatorType,
  locales?: string | string[],
  options?: CollatorOptions
) {
  if (!this || !OrdinaryHasInstance(Collator, this)) {
    return new Collator(locales, options)
  }

  const requestedLocales = CanonicalizeLocaleList(locales)
  const opts = options === undefined ? Object.create(null) : ToObject(options)
  const usage = GetOption(
    opts,
    'usage',
    'string',
    ['sort', 'search'],
    'sort'
  )
  const matcher = GetOption(
    opts,
    'localeMatcher',
    'string',
    ['lookup', 'best fit'],
    'best fit'
  )
  const numeric = GetOption(opts, 'numeric', 'boolean', undefined, undefined)
  const caseFirst = GetOption(
    opts,
    'caseFirst',
    'string',
    ['upper', 'lower', 'false'],
    undefined
  )
  const opt = Object.create(null)
  opt.localeMatcher = matcher
  const collation = GetOption(
    opts,
    'collation',
    'string',
    undefined,
    undefined
  )
  if (typeof collation === 'string') {
    opt.co = collation
  }
  if (numeric !== undefined) {
    opt.kn = String(numeric)
  }
  if (caseFirst !== undefined) {
    opt.kf = caseFirst
  }

  const r = ResolveLocale(
    Collator.availableLocales,
    requestedLocales,
    opt,
    Collator.relevantExtensionKeys,
    Collator.localeData,
    Collator.getDefaultLocale
  )
  const resolvedLocaleData = Collator.localeData[r.dataLocale]
  invariant(!!resolvedLocaleData, `Missing locale data for ${r.dataLocale}`)

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

  const internalSlots = getInternalSlots(this)
  internalSlots.initializedCollator = true
  internalSlots.locale = r.locale
  internalSlots.usage = usage
  internalSlots.collation = r.co === undefined ? 'default' : r.co
  internalSlots.numeric = r.kn === 'true'
  internalSlots.caseFirst = r.kf || 'false'
  internalSlots.sensitivity = sensitivity
  internalSlots.ignorePunctuation = ignorePunctuation
} as CollatorConstructor

Object.defineProperty(Collator, 'supportedLocalesOf', {
  value: function supportedLocalesOf(
    locales?: string | string[],
    options?: Pick<CollatorOptions, 'localeMatcher'>
  ) {
    return SupportedLocales(
      Collator.availableLocales,
      CanonicalizeLocaleList(locales),
      options
    )
  },
})

Object.defineProperty(Collator.prototype, 'compare', {
  configurable: true,
  get(this: CollatorType) {
    if (
      typeof this !== 'object' ||
      !OrdinaryHasInstance(Collator, this)
    ) {
      throw TypeError(
        'Intl.Collator compare property accessor called on incompatible receiver'
      )
    }
    const collator = this
    const internalSlots = getInternalSlots(collator)
    let boundCompare = internalSlots.boundCompare
    if (boundCompare === undefined) {
      boundCompare = (x: string, y: string) =>
        compareCollatorStrings(internalSlots, String(x), String(y))
      internalSlots.boundCompare = boundCompare
    }
    return boundCompare
  },
})

Object.defineProperty(Collator.prototype, 'resolvedOptions', {
  value: function resolvedOptions(this: CollatorType): ResolvedCollatorOptions {
    if (
      typeof this !== 'object' ||
      !OrdinaryHasInstance(Collator, this)
    ) {
      throw TypeError(
        'Method Intl.Collator.prototype.resolvedOptions called on incompatible receiver'
      )
    }
    const internalSlots = getInternalSlots(this)
    const result: Record<string, unknown> = {}
    for (const key of RESOLVED_OPTIONS_KEYS) {
      result[key] = internalSlots[key]
    }
    return result as unknown as ResolvedCollatorOptions
  },
})

Collator.availableLocales = new Set(availableCollationLocales)
Collator.relevantExtensionKeys = ['co', 'kn', 'kf']
Collator.getDefaultLocale = () => 'en'
Collator.localeData = collationLocaleData as unknown as Record<
  string,
  CollatorLocaleData | undefined
>
Collator.polyfilled = true

try {
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
} catch {
}

ensureIntl()
