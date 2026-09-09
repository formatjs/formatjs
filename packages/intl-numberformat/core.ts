import {OrdinaryHasInstance} from '#packages/ecma262-abstract/OrdinaryHasInstance.js'
import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {FormatNumeric} from '#packages/ecma402-abstract/NumberFormat/FormatNumeric.js'
import {FormatNumericRange} from '#packages/ecma402-abstract/NumberFormat/FormatNumericRange.js'
import {FormatNumericRangeToParts} from '#packages/ecma402-abstract/NumberFormat/FormatNumericRangeToParts.js'
import {FormatNumericToParts} from '#packages/ecma402-abstract/NumberFormat/FormatNumericToParts.js'
import {InitializeNumberFormat} from '#packages/ecma402-abstract/NumberFormat/InitializeNumberFormat.js'
import {SupportedLocales} from '#packages/ecma402-abstract/SupportedLocales.js'
import {ToIntlMathematicalValue} from '#packages/ecma402-abstract/ToIntlMathematicalValue.js'
import {
  type NumberFormatOptions,
  type RawNumberLocaleData,
} from '#packages/ecma402-abstract/types/number.js'
import {
  getLocaleDataAlias,
  createMemoizedPluralRules,
  defineProperty,
  invariant,
} from '#packages/ecma402-abstract/utils.js'
import {currencyDigitsData} from '@formatjs_generated/cldr.number/currency-digits.js'
// eslint-disable-next-line import/no-cycle
import type Decimal from '@formatjs/bigdecimal'
import getInternalSlots from '#packages/intl-numberformat/get_internal_slots.js'
import {
  type NumberFormatConstructor,
  type NumberFormat as NumberFormatType,
} from '#packages/intl-numberformat/types.js'

// Merge declaration with the constructor defined below.
export type NumberFormat = NumberFormatType

const RESOLVED_OPTIONS_KEYS = [
  'locale',
  'numberingSystem',
  'style',
  'currency',
  'currencyDisplay',
  'currencySign',
  'unit',
  'unitDisplay',
  'minimumIntegerDigits',
  'minimumFractionDigits',
  'maximumFractionDigits',
  'minimumSignificantDigits',
  'maximumSignificantDigits',
  'useGrouping',
  'notation',
  'compactDisplay',
  'signDisplay',
  'roundingIncrement',
  'roundingMode',
] as const

/**
 * https://tc39.es/ecma402/#sec-intl-numberformat-constructor
 */
export const NumberFormat = function (
  this: NumberFormat,
  locales?: string | string[],
  options?: NumberFormatOptions
) {
  // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
  if (!this || !OrdinaryHasInstance(NumberFormat, this)) {
    return new NumberFormat(locales, options)
  }

  InitializeNumberFormat(this as any, locales, options, {
    getInternalSlots: nf => getInternalSlots(nf, true),
    localeData: NumberFormat.localeData,
    availableLocales: NumberFormat.availableLocales,
    getDefaultLocale: NumberFormat.getDefaultLocale,
    currencyDigitsData,
  })

  const internalSlots = getInternalSlots(this as any)

  const dataLocale = internalSlots.dataLocale
  const dataLocaleData = NumberFormat.localeData[dataLocale]
  invariant(
    dataLocaleData !== undefined,
    `Cannot load locale-dependent data for ${dataLocale}.`
  )

  internalSlots.pl = createMemoizedPluralRules(dataLocale, {
    minimumFractionDigits: internalSlots.minimumFractionDigits,
    maximumFractionDigits: internalSlots.maximumFractionDigits,
    minimumIntegerDigits: internalSlots.minimumIntegerDigits,
    minimumSignificantDigits: internalSlots.minimumSignificantDigits,
    maximumSignificantDigits: internalSlots.maximumSignificantDigits,
  })
  return this
} as NumberFormatConstructor

// ECMA-402 §7 applies ECMA-262 §18 built-in function requirements: these
// methods have no [[Construct]] or own prototype property.
// https://tc39.es/ecma262/#sec-ecmascript-standard-built-in-objects
// https://github.com/tc39/ecma262/blob/b7865f0eed2021720f84d561289401bc414874d0/spec.html#L30375-L30385
const {formatToParts, formatRange, formatRangeToParts} = {
  formatToParts(this: Intl.NumberFormat, x: number | bigint | Decimal) {
    // ECMA-402 §16.3.6 step 2 precedes argument conversion in step 3.
    // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.formattoparts
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L492-L493
    getInternalSlots(this)
    return FormatNumericToParts(this, ToIntlMathematicalValue(x), {
      getInternalSlots,
    })
  },

  formatRange(
    this: Intl.NumberFormat,
    start: number | bigint | Decimal,
    end: number | bigint | Decimal
  ) {
    getInternalSlots(this)
    // ECMA-402 §16.3.4, step 3: reject missing endpoints before coercion.
    // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.formatrange
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L463-L465
    if (start === undefined || end === undefined) {
      throw new TypeError('Range endpoints must not be undefined')
    }
    return FormatNumericRange(
      this,
      ToIntlMathematicalValue(start),
      ToIntlMathematicalValue(end),
      {
        getInternalSlots,
      }
    )
  },

  formatRangeToParts(
    this: Intl.NumberFormat,
    start: number | bigint | Decimal,
    end: number | bigint | Decimal
  ) {
    getInternalSlots(this)
    // ECMA-402 §16.3.5, step 3: reject missing endpoints before coercion.
    // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.formatrangetoparts
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L478-L480
    if (start === undefined || end === undefined) {
      throw new TypeError('Range endpoints must not be undefined')
    }
    return FormatNumericRangeToParts(
      this,
      ToIntlMathematicalValue(start),
      ToIntlMathematicalValue(end),
      {
        getInternalSlots,
      }
    )
  },
}

defineProperty(NumberFormat.prototype, 'formatToParts', {
  value: formatToParts,
})

defineProperty(NumberFormat.prototype, 'formatRange', {
  value: formatRange,
})

defineProperty(NumberFormat.prototype, 'formatRangeToParts', {
  value: formatRangeToParts,
})

const {resolvedOptions} = {
  resolvedOptions() {
    const internalSlots = getInternalSlots(this as any)
    const ro: Record<string, unknown> = {}
    for (const key of RESOLVED_OPTIONS_KEYS) {
      const value = internalSlots[key]
      if (value !== undefined) {
        ro[key] = value
      }
    }
    if (internalSlots.roundingType === 'morePrecision') {
      ro.roundingPriority = 'morePrecision'
    } else if (internalSlots.roundingType === 'lessPrecision') {
      ro.roundingPriority = 'lessPrecision'
    } else {
      ro.roundingPriority = 'auto'
    }
    // ECMA-402 §16.3.2, step 5: create properties in table order.
    // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.resolvedoptions
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L302-L309
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L418-L427
    ro.trailingZeroDisplay = internalSlots.trailingZeroDisplay
    return ro as any
  },
}

defineProperty(NumberFormat.prototype, 'resolvedOptions', {
  value: resolvedOptions,
})

const formatDescriptor = {
  enumerable: false,
  configurable: true,
  get(this: NumberFormat) {
    const internalSlots = getInternalSlots(this as any)
    let boundFormat = internalSlots.boundFormat
    if (boundFormat === undefined) {
      // https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_diff_out.html#sec-number-format-functions
      boundFormat = (
        value?:
          | number
          | bigint
          | `${number}`
          | 'Infinity'
          | '-Infinity'
          | '+Infinity'
      ) => FormatNumeric(internalSlots, ToIntlMathematicalValue(value))

      try {
        // https://github.com/tc39/test262/blob/master/test/intl402/NumberFormat/prototype/format/format-function-name.js
        Object.defineProperty(boundFormat, 'name', {
          configurable: true,
          enumerable: false,
          writable: false,
          value: '',
        })
      } catch {
        // In older browser (e.g Chrome 36 like polyfill-fastly.io)
        // TypeError: Cannot redefine property: name
      }
      internalSlots.boundFormat = boundFormat
    }
    return boundFormat
  },
} as const
try {
  // https://github.com/tc39/test262/blob/master/test/intl402/NumberFormat/prototype/format/name.js
  Object.defineProperty(formatDescriptor.get, 'name', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: 'get format',
  })
} catch {
  // In older browser (e.g Chrome 36 like polyfill-fastly.io)
  // TypeError: Cannot redefine property: name
}

Object.defineProperty(NumberFormat.prototype, 'format', formatDescriptor)

// Static properties
const {supportedLocalesOf} = {
  supportedLocalesOf(
    locales: string | string[],
    options?: Pick<NumberFormatOptions, 'localeMatcher'>
  ) {
    return SupportedLocales(
      NumberFormat.availableLocales,
      CanonicalizeLocaleList(locales),
      options
    )
  },
}

defineProperty(NumberFormat, 'supportedLocalesOf', {value: supportedLocalesOf})

NumberFormat.__addLocaleData = function __addLocaleData(
  ...data: RawNumberLocaleData[]
) {
  for (const {data: d, locale} of data) {
    const minimizedLocale = getLocaleDataAlias(locale)
    NumberFormat.localeData[locale] = NumberFormat.localeData[minimizedLocale] =
      d
    NumberFormat.availableLocales.add(minimizedLocale)
    NumberFormat.availableLocales.add(locale)
    if (!NumberFormat.__defaultLocale) {
      NumberFormat.__defaultLocale = minimizedLocale
    }
  }
}

NumberFormat.__addUnitData = function __addUnitData(
  locale: string,
  unitsData: RawNumberLocaleData['data']['units']
) {
  const {[locale]: existingData} = NumberFormat.localeData
  if (!existingData) {
    throw new Error(`Locale data for "${locale}" has not been loaded in NumberFormat. 
Please __addLocaleData before adding additional unit data`)
  }

  for (const unit in unitsData.simple) {
    existingData.units.simple[unit] = unitsData.simple[unit]
  }
  for (const unit in unitsData.compound) {
    existingData.units.compound[unit] = unitsData.compound[unit]
  }
}

NumberFormat.__defaultLocale = ''
NumberFormat.localeData = {}
NumberFormat.availableLocales = new Set<string>()
NumberFormat.getDefaultLocale = () => {
  return NumberFormat.__defaultLocale
}
NumberFormat.polyfilled = true

try {
  // IE11 does not have Symbol
  if (typeof Symbol !== 'undefined') {
    Object.defineProperty(NumberFormat.prototype, Symbol.toStringTag, {
      configurable: true,
      enumerable: false,
      writable: false,
      value: 'Intl.NumberFormat',
    })
  }

  // https://github.com/tc39/test262/blob/master/test/intl402/NumberFormat/length.js
  Object.defineProperty(NumberFormat.prototype.constructor, 'length', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: 0,
  })
  // https://github.com/tc39/test262/blob/master/test/intl402/NumberFormat/supportedLocalesOf/length.js
  Object.defineProperty(NumberFormat.supportedLocalesOf, 'length', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: 1,
  })

  Object.defineProperty(NumberFormat, 'prototype', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: NumberFormat.prototype,
  })
} catch {
  // Meta fix so we're test262-compliant, not important
}
