import {
  canonicalizeLocaleDataTag,
  registerLocaleData,
} from '#packages/ecma402-abstract/registerLocaleData.js'
import {
  arrayIncludes,
  createFromConstructor,
  nullClassBase,
  setDataProperty,
  TypeErrorConstructor,
} from '#packages/ecma262-abstract/intrinsics.js'
import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {SupportedLocales} from '#packages/ecma402-abstract/SupportedLocales.js'
import {ToIntlMathematicalValue} from '#packages/ecma402-abstract/ToIntlMathematicalValue.js'
import {
  type NumberFormatDigitInternalSlots,
  type NumberFormatDigitOptions,
} from '#packages/ecma402-abstract/types/number.js'
import {
  type LDMLPluralRule,
  type PluralRulesData,
  type PluralRulesLocaleData,
} from '#packages/ecma402-abstract/types/plural-rules.js'
import {InitializePluralRules} from '#packages/ecma402-abstract/PluralRules/InitializePluralRules.js'
import {ResolvePlural} from '#packages/ecma402-abstract/PluralRules/ResolvePlural.js'
import {ResolvePluralRange} from '#packages/ecma402-abstract/PluralRules/ResolvePluralRange.js'
import getInternalSlots, {
  requireInternalSlots,
} from '#packages/intl-pluralrules/get_internal_slots.js'

/**
 * Type augmentation for Intl.PluralRules
 *
 * ECMA-402 Spec: selectRange method (Intl.PluralRules.prototype.selectRange)
 * https://tc39.es/ecma402/#sec-intl.pluralrules.prototype.selectrange
 *
 * ECMA-402 notation and compactDisplay options
 * Mirrors Intl.NumberFormat notation option for proper plural selection with compact numbers
 */
declare global {
  namespace Intl {
    interface PluralRules {
      select(value?: number | bigint | string): LDMLPluralRule
      // ECMA-402 Spec: selectRange method
      selectRange(
        start: number | bigint | string,
        end: number | bigint | string
      ): LDMLPluralRule
    }
    interface ResolvedPluralRulesOptions {
      trailingZeroDisplay: NumberFormatDigitInternalSlots['trailingZeroDisplay']
    }
    // Constructor delegates all digit options to SetNumberFormatDigitOptions.
    // https://tc39.es/ecma402/#sec-intl.pluralrules
    interface PluralRulesOptions extends NumberFormatDigitOptions {
      // ECMA-402 §17.1.1 Intl.PluralRules, steps 9–13.
      // https://tc39.es/ecma402/#sec-intl.pluralrules
      notation?: 'standard' | 'scientific' | 'engineering' | 'compact'
      // Only reported in resolvedOptions when notation is compact.
      compactDisplay?: 'short' | 'long'
    }
  }
}

export type {PluralRulesInternal} from '#packages/ecma402-abstract/types/plural-rules.js'

/**
 * https://tc39.es/ecma402/#sec-pluralruleselect
 */
function PluralRuleSelect(
  localeData: PluralRulesData | undefined,
  type: 'cardinal' | 'ordinal',
  decimalString: string,
  exponent: number
): LDMLPluralRule {
  return localeData!.fn(decimalString, type === 'ordinal', exponent)
}

// ECMA-402 §17.5.3 uses CLDR to resolve the two categories for this locale.
// https://tc39.es/ecma402/#sec-pluralruleselectrange
function PluralRuleSelectRange(
  localeData: PluralRulesData | undefined,
  type: 'cardinal' | 'ordinal',
  xp: LDMLPluralRule,
  yp: LDMLPluralRule
): LDMLPluralRule {
  const ranges =
    localeData && HasOwnProperty(localeData, 'pluralRanges')
      ? localeData.pluralRanges
      : undefined
  // CLDR tables contain own fields keyed by the selected category pair.
  const rangeData =
    ranges && HasOwnProperty(ranges, type) ? ranges[type] : undefined
  const key = `${xp}_${yp}` as const
  return rangeData && HasOwnProperty(rangeData, key)
    ? (rangeData[key] ?? yp)
    : yp
}

let defaultLocale = ''
function getDefaultLocale(): string {
  return defaultLocale
}
// ECMA-402 §17.2.3 defines an empty internal extension list.
// https://tc39.es/ecma402/#sec-intl.pluralrules-internal-slots
const relevantExtensionKeys: never[] = []

// ECMA-402 §17.2 Constructor inherits Function.prototype.
// https://tc39.es/ecma402/#sec-properties-of-intl-pluralrules-constructor
//
// ECMA-402 §17.2.1 https://tc39.es/ecma402/#sec-intl.pluralrules.prototype
// ECMA-402 §17.3.1 https://tc39.es/ecma402/#sec-intl.pluralrules.prototype.constructor
export class PluralRules extends nullClassBase {
  // @ts-expect-error TS2377: extends null and returns its own receiver.
  // oxlint-disable-next-line constructor-super -- The constructor returns its allocated receiver.
  constructor(locales?: string | string[], options?: Intl.PluralRulesOptions) {
    // ECMA-402 §17.1.1 uses NewTarget to allocate the branded receiver.
    // https://tc39.es/ecma402/#sec-intl.pluralrules
    const receiver = createFromConstructor(new.target, PluralRules.prototype)
    return InitializePluralRules(receiver, locales, options, {
      availableLocales: PluralRules.availableLocales,
      relevantExtensionKeys,
      localeData: PluralRules.localeData,
      getDefaultLocale,
      getInternalSlots,
    })
  }
  public resolvedOptions(): Intl.ResolvedPluralRulesOptions {
    const internalSlots = requireInternalSlots(this)
    // Ordinary result object and property order follow the resolved-options table.
    // ECMA-402 §17.3.2 Intl.PluralRules.prototype.resolvedOptions, steps 3–5, Table 32.
    // https://tc39.es/ecma402/#sec-intl.pluralrules.prototype.resolvedoptions
    const opts: Record<string, any> = {}
    const fields = [
      'locale',
      'type',
      'notation',
      'compactDisplay',
      'minimumIntegerDigits',
      'minimumFractionDigits',
      'maximumFractionDigits',
      'minimumSignificantDigits',
      'maximumSignificantDigits',
    ] as const
    for (let index = 0; index < fields.length; index++) {
      const field = fields[index]
      const val = internalSlots[field]
      if (val !== undefined) {
        setDataProperty(opts, field, val)
      }
    }

    const categories = internalSlots.localeData!.categories[internalSlots.type]
    const ordered = ['zero', 'one', 'two', 'few', 'many', 'other'] as const
    const pluralCategories: LDMLPluralRule[] = []
    for (let index = 0; index < ordered.length; index++) {
      const category = ordered[index]
      if (arrayIncludes(categories, category)) {
        setDataProperty(pluralCategories, pluralCategories.length, category)
      }
    }
    setDataProperty(opts, 'pluralCategories', pluralCategories)
    setDataProperty(opts, 'roundingIncrement', internalSlots.roundingIncrement)
    setDataProperty(opts, 'roundingMode', internalSlots.roundingMode)
    setDataProperty(opts, 'roundingPriority', internalSlots.roundingPriority)
    setDataProperty(
      opts,
      'trailingZeroDisplay',
      internalSlots.trailingZeroDisplay
    )
    return opts as Intl.ResolvedPluralRulesOptions
  }

  public select(val?: number | bigint | string): LDMLPluralRule {
    requireInternalSlots(this)
    // Use ToIntlMathematicalValue which handles bigint per ECMA-402
    // https://tc39.es/ecma402/#sec-intl.pluralrules.prototype.select
    const n = ToIntlMathematicalValue(val)
    return ResolvePlural(this, n, {getInternalSlots, PluralRuleSelect})
  }
  // ECMA-402 §17.3.4 steps 2–6: require both endpoints, then coerce left to right.
  // https://tc39.es/ecma402/#sec-intl.pluralrules.prototype.selectrange
  public selectRange(
    start: number | bigint | string,
    end: number | bigint | string
  ): LDMLPluralRule {
    requireInternalSlots(this)
    // 3. If start is undefined or end is undefined, throw a TypeError exception.
    if (start === undefined || end === undefined) {
      throw new TypeErrorConstructor(
        'selectRange requires both start and end arguments'
      )
    }

    // 4. Let x be ? ToIntlMathematicalValue(start).
    const x = ToIntlMathematicalValue(start)

    // 5. Let y be ? ToIntlMathematicalValue(end).
    const y = ToIntlMathematicalValue(end)

    // 6. Return ? ResolvePluralRange(pr, x, y).
    return ResolvePluralRange(this, x, y, {
      getInternalSlots,
      PluralRuleSelect,
      PluralRuleSelectRange,
    })
  }
  public static supportedLocalesOf(
    locales?: string | string[],
    options?: Pick<Intl.PluralRulesOptions, 'localeMatcher'>
  ): string[] {
    // ECMA-402 §17.2.2 https://tc39.es/ecma402/#sec-intl.pluralrules.supportedlocalesof
    return SupportedLocales(
      PluralRules.availableLocales,
      CanonicalizeLocaleList(locales),
      options
    )
  }
  public static __addLocaleData(...data: PluralRulesLocaleData[]): void {
    for (const {data: d, locale: tag} of data) {
      // AvailableLocales and its data keys must use the same canonical ID.
      // Otherwise sh resolves to sr-Latn, where no registered payload exists.
      // https://tc39.es/ecma402/#sec-internal-slots
      const locale = canonicalizeLocaleDataTag(tag)
      registerLocaleData(
        locale,
        d,
        PluralRules.localeData,
        PluralRules.availableLocales
      )
      if (!defaultLocale) {
        defaultLocale = locale
      }
    }
  }
  // ECMA-402 §17.2.3: register plural data without locale extension keys.
  // https://tc39.es/ecma402/#sec-intl.pluralrules-internal-slots
  static localeData: Record<string, PluralRulesData> = Object.create(null)
  static availableLocales: Set<string> = new Set<string>()
  declare static __defaultLocale: string
  static getDefaultLocale(): string {
    return getDefaultLocale()
  }
  static relevantExtensionKeys: never[] = []
  public static polyfilled = true
}

// ECMA-402 §9.2.7 step 3 uses the internal default during locale resolution.
// https://tc39.es/ecma402/#sec-resolvelocale
Object.defineProperty(PluralRules, '__defaultLocale', {
  configurable: true,
  enumerable: true,
  get: getDefaultLocale,
  set(locale: string) {
    defaultLocale = locale
  },
})

// ECMA-402 §17.3 Ordinary prototype inherits Object.prototype and has no instance slots.
// https://tc39.es/ecma402/#sec-properties-of-intl-pluralrules-prototype-object
Object.setPrototypeOf(PluralRules.prototype, Object.prototype)

try {
  // ECMA-402 §17.3.5 https://tc39.es/ecma402/#sec-intl.pluralrules.prototype-%symbol.tostringtag%
  if (typeof Symbol !== 'undefined') {
    Object.defineProperty(PluralRules.prototype, Symbol.toStringTag, {
      value: 'Intl.PluralRules',
      writable: false,
      enumerable: false,
      configurable: true,
    })
  }

  try {
    // https://github.com/tc39/test262/blob/master/test/intl402/PluralRules/length.js
    Object.defineProperty(PluralRules, 'length', {
      value: 0,
      writable: false,
      enumerable: false,
      configurable: true,
    })
  } catch {
    // IE 11 sets Function.prototype.length to be non-configurable which will cause the
    // above Object.defineProperty to throw an error.
  }
  // https://github.com/tc39/test262/blob/master/test/intl402/RelativeTimeFormat/constructor/length.js
  Object.defineProperty(PluralRules.prototype.constructor, 'length', {
    value: 0,
    writable: false,
    enumerable: false,
    configurable: true,
  })
  // https://github.com/tc39/test262/blob/master/test/intl402/RelativeTimeFormat/constructor/supportedLocalesOf/length.js
  Object.defineProperty(PluralRules.supportedLocalesOf, 'length', {
    value: 1,
    writable: false,
    enumerable: false,
    configurable: true,
  })
  Object.defineProperty(PluralRules, 'name', {
    value: 'PluralRules',
    writable: false,
    enumerable: false,
    configurable: true,
  })
} catch {
  // Meta fixes for test262
}
