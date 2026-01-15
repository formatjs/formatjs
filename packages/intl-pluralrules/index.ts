import {
  CanonicalizeLocaleList,
  type LDMLPluralRule,
  type NumberFormatDigitInternalSlots,
  type PluralRulesData,
  type PluralRulesLocaleData,
  SupportedLocales,
  ToIntlMathematicalValue,
} from '@formatjs/ecma402-abstract'
import type Decimal from 'decimal.js'
import {type OperandsRecord} from './abstract/GetOperands.js'
import {InitializePluralRules} from './abstract/InitializePluralRules.js'
import {ResolvePlural} from './abstract/ResolvePlural.js'
import {ResolvePluralRange} from './abstract/ResolvePluralRange.js'
import getInternalSlots from './get_internal_slots.js'

/**
 * Type augmentation for Intl.PluralRules
 *
 * ECMA-402 Spec: selectRange method (Intl.PluralRules.prototype.selectRange)
 * https://tc39.es/ecma402/#sec-intl.pluralrules.prototype.selectrange
 *
 * Extension: notation and compactDisplay options (not in ECMA-402 spec)
 * Mirrors Intl.NumberFormat notation option for proper plural selection with compact numbers
 */
declare global {
  namespace Intl {
    interface PluralRules {
      // ECMA-402 Spec: selectRange method
      selectRange(start: number | bigint, end: number | bigint): LDMLPluralRule
    }
    interface PluralRulesOptions {
      // Extension: notation option (mirrors Intl.NumberFormat)
      notation?: 'standard' | 'compact'
      // Extension: compactDisplay option (mirrors Intl.NumberFormat)
      compactDisplay?: 'short' | 'long'
    }
  }
}

function validateInstance(instance: any, method: string) {
  if (!(instance instanceof PluralRules)) {
    throw new TypeError(
      `Method Intl.PluralRules.prototype.${method} called on incompatible receiver ${String(
        instance
      )}`
    )
  }
}

export interface PluralRulesInternal extends NumberFormatDigitInternalSlots {
  initializedPluralRules: boolean
  locale: string
  type: 'cardinal' | 'ordinal'
  notation: 'standard' | 'compact'
  compactDisplay?: 'short' | 'long'
  dataLocaleData?: any // NumberFormatLocaleInternalData
}

/**
 * http://ecma-international.org/ecma-402/7.0/index.html#sec-pluralruleselect
 * @param locale
 * @param type
 * @param _n
 * @param param3
 */
function PluralRuleSelect(
  locale: string,
  type: 'cardinal' | 'ordinal',
  _n: Decimal,
  {
    IntegerDigits,
    NumberOfFractionDigits,
    FractionDigits,
    CompactExponent,
  }: OperandsRecord
): LDMLPluralRule {
  // Always pass a string to the compiled function to preserve precision for huge numbers
  return PluralRules.localeData[locale].fn(
    NumberOfFractionDigits
      ? `${IntegerDigits}.${FractionDigits}`
      : String(IntegerDigits),
    type === 'ordinal',
    CompactExponent
  )
}

/**
 * PluralRuleSelectRange ( locale, type, notation, compactDisplay, start, end )
 *
 * Implementation-defined abstract operation that determines the plural category for a range
 * by consulting CLDR plural range data. Each locale defines how different combinations of
 * start and end plural categories map to a range plural category.
 *
 * Examples from CLDR:
 * - English: "one" + "other" → "other" (e.g., "1-2 items")
 * - French: "one" + "one" → "one" (e.g., "0-1 vue")
 * - Arabic: "few" + "many" → "many" (e.g., complex range rules)
 *
 * The spec allows this to be implementation-defined, and we use CLDR supplemental data
 * from pluralRanges.json which provides explicit mappings for each locale.
 *
 * @param locale - BCP 47 locale identifier
 * @param type - "cardinal" or "ordinal"
 * @param xp - Start plural category
 * @param yp - End plural category
 * @returns The plural category for the range
 */
function PluralRuleSelectRange(
  locale: string,
  type: 'cardinal' | 'ordinal',
  xp: LDMLPluralRule,
  yp: LDMLPluralRule
): LDMLPluralRule {
  const localeData = PluralRules.localeData[locale]
  if (!localeData || !localeData.pluralRanges) {
    // Fallback: If no range data is available, return the end category.
    // This is a reasonable default as the end value often determines the plural form.
    return yp
  }

  // Construct lookup key: "start_end" (e.g., "one_other", "few_many")
  const key = `${xp}_${yp}` as const

  // Select the appropriate range data based on type (cardinal vs ordinal)
  const rangeData =
    type === 'ordinal'
      ? localeData.pluralRanges.ordinal
      : localeData.pluralRanges.cardinal

  // Look up the result, falling back to end category if not found
  return rangeData?.[key] ?? yp
}

export class PluralRules {
  constructor(locales?: string | string[], options?: Intl.PluralRulesOptions) {
    // test262/test/intl402/RelativeTimeFormat/constructor/constructor/newtarget-undefined.js
    // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
    const newTarget =
      this && this instanceof PluralRules ? this.constructor : void 0
    if (!newTarget) {
      throw new TypeError("Intl.PluralRules must be called with 'new'")
    }
    return InitializePluralRules(this, locales, options, {
      availableLocales: PluralRules.availableLocales,
      relevantExtensionKeys: PluralRules.relevantExtensionKeys,
      localeData: PluralRules.localeData,
      getDefaultLocale: PluralRules.getDefaultLocale,
      getInternalSlots,
    })
  }
  public resolvedOptions(): Intl.ResolvedPluralRulesOptions {
    validateInstance(this, 'resolvedOptions')
    const opts = Object.create(null)
    const internalSlots = getInternalSlots(this)
    opts.locale = internalSlots.locale
    opts.type = internalSlots.type
    ;(
      [
        'minimumIntegerDigits',
        'minimumFractionDigits',
        'maximumFractionDigits',
        'minimumSignificantDigits',
        'maximumSignificantDigits',
      ] as Array<keyof PluralRulesInternal>
    ).forEach(field => {
      const val = internalSlots[field]
      if (val !== undefined) {
        opts[field] = val
      }
    })

    opts.pluralCategories = [
      ...PluralRules.localeData[opts.locale].categories[
        opts.type as 'cardinal'
      ],
    ]
    return opts
  }
  public select(val: number | bigint): LDMLPluralRule {
    validateInstance(this, 'select')
    // Use ToIntlMathematicalValue which handles bigint per ECMA-402
    // https://tc39.es/ecma402/#sec-intl.pluralrules.prototype.select
    const n = ToIntlMathematicalValue(val)
    return ResolvePlural(this, n, {getInternalSlots, PluralRuleSelect})
  }
  /**
   * Intl.PluralRules.prototype.selectRange ( start, end )
   *
   * Returns a string indicating which plural rule applies to a range of numbers.
   * This is useful for formatting ranges like "1-2 items" vs "2-3 items" where
   * different languages have different plural rules for ranges.
   *
   * Specification: https://tc39.es/ecma402/#sec-intl.pluralrules.prototype.selectrange
   *
   * @param start - The start value of the range (number or bigint)
   * @param end - The end value of the range (number or bigint)
   * @returns The plural category for the range (zero, one, two, few, many, or other)
   *
   * @example
   * const pr = new Intl.PluralRules('en');
   * pr.selectRange(1, 2); // "other" (English: "1-2 items")
   * pr.selectRange(1, 1); // "one" (same value: "1 item")
   *
   * @example
   * const prFr = new Intl.PluralRules('fr');
   * prFr.selectRange(0, 1); // "one" (French: "0-1 vue")
   * prFr.selectRange(1, 2); // "other" (French: "1-2 vues")
   *
   * @example
   * // BigInt support (spec-compliant, but Chrome has a bug as of early 2025)
   * pr.selectRange(BigInt(1), BigInt(2)); // "other"
   *
   * @throws {TypeError} If start or end is undefined
   * @throws {RangeError} If start or end is not a finite number (Infinity, NaN)
   *
   * @note Chrome's native implementation (as of early 2025) has a bug where it throws
   * "Cannot convert a BigInt value to a number" when using BigInt arguments. This is
   * a browser bug - the spec requires BigInt support. This polyfill handles BigInt correctly.
   */
  public selectRange(
    start: number | bigint,
    end: number | bigint
  ): LDMLPluralRule {
    validateInstance(this, 'selectRange')
    // Spec: https://tc39.es/ecma402/#sec-intl.pluralrules.prototype.selectrange

    // 1. Let pr be the this value.
    // 2. Perform ? RequireInternalSlot(pr, [[InitializedPluralRules]]).
    // (Validation is done by validateInstance above)

    // 3. If start is undefined or end is undefined, throw a TypeError exception.
    if (start === undefined || end === undefined) {
      throw new TypeError('selectRange requires both start and end arguments')
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
  toString() {
    return '[object Intl.PluralRules]'
  }
  public static supportedLocalesOf(
    locales?: string | string[],
    options?: Pick<Intl.PluralRulesOptions, 'localeMatcher'>
  ): string[] {
    return SupportedLocales(
      PluralRules.availableLocales,
      CanonicalizeLocaleList(locales),
      options
    )
  }
  public static __addLocaleData(...data: PluralRulesLocaleData[]): void {
    for (const {data: d, locale} of data) {
      PluralRules.localeData[locale] = d
      PluralRules.availableLocales.add(locale)
      if (!PluralRules.__defaultLocale) {
        PluralRules.__defaultLocale = locale
      }
    }
  }
  static localeData: Record<string, PluralRulesData> = {}
  static availableLocales: Set<string> = new Set<string>()
  static __defaultLocale = ''
  static getDefaultLocale(): string {
    return PluralRules.__defaultLocale
  }
  static relevantExtensionKeys: never[] = []
  public static polyfilled = true
}

try {
  // IE11 does not have Symbol
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
