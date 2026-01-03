import {
  CanonicalizeLocaleList,
  type LDMLPluralRule,
  type NumberFormatDigitInternalSlots,
  type PluralRulesData,
  type PluralRulesLocaleData,
  SupportedLocales,
  ToNumber,
} from '@formatjs/ecma402-abstract'
import type Decimal from 'decimal.js'
import {type OperandsRecord} from './abstract/GetOperands.js'
import {InitializePluralRules} from './abstract/InitializePluralRules.js'
import {ResolvePlural} from './abstract/ResolvePlural.js'
import getInternalSlots from './get_internal_slots.js'

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
  {IntegerDigits, NumberOfFractionDigits, FractionDigits}: OperandsRecord
): LDMLPluralRule {
  return PluralRules.localeData[locale].fn(
    NumberOfFractionDigits
      ? `${IntegerDigits}.${FractionDigits}`
      : IntegerDigits,
    type === 'ordinal'
  )
}

export class PluralRules implements Intl.PluralRules {
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
  public select(val: number): LDMLPluralRule {
    validateInstance(this, 'select')
    const n = ToNumber(val)
    return ResolvePlural(this, n, {getInternalSlots, PluralRuleSelect})
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
