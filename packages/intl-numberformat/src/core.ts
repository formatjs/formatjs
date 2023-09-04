import {
  defineProperty,
  invariant,
  RawNumberLocaleData,
  SupportedLocales,
  InitializeNumberFormat,
  FormatNumericToParts,
  NumberFormatOptions,
  ToNumber,
  CanonicalizeLocaleList,
  OrdinaryHasInstance,
  FormatNumericRange,
  FormatNumericRangeToParts,
} from '@formatjs/ecma402-abstract'
import {currencyDigitsData} from './currency-digits.generated'
import {numberingSystemNames} from './numbering-systems.generated'
// eslint-disable-next-line import/no-cycle
import getInternalSlots from './get_internal_slots'
import {
  NumberFormatConstructor,
  NumberFormat as NumberFormatType,
} from './types'

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
    getInternalSlots,
    localeData: NumberFormat.localeData,
    availableLocales: NumberFormat.availableLocales,
    getDefaultLocale: NumberFormat.getDefaultLocale,
    currencyDigitsData,
    numberingSystemNames,
  })

  const internalSlots = getInternalSlots(this as any)

  const dataLocale = internalSlots.dataLocale
  const dataLocaleData = NumberFormat.localeData[dataLocale]
  invariant(
    dataLocaleData !== undefined,
    `Cannot load locale-dependent data for ${dataLocale}.`
  )

  internalSlots.pl = new Intl.PluralRules(dataLocale, {
    minimumFractionDigits: internalSlots.minimumFractionDigits,
    maximumFractionDigits: internalSlots.maximumFractionDigits,
    minimumIntegerDigits: internalSlots.minimumIntegerDigits,
    minimumSignificantDigits: internalSlots.minimumSignificantDigits,
    maximumSignificantDigits: internalSlots.maximumSignificantDigits,
  } as any)
  return this
} as NumberFormatConstructor

function formatToParts(this: Intl.NumberFormat, x: number) {
  return FormatNumericToParts(this, toNumeric(x) as number, {
    getInternalSlots,
  })
}

function formatRange(this: Intl.NumberFormat, start: number, end: number) {
  return FormatNumericRange(this, start, end, {getInternalSlots})
}

function formatRangeToParts(
  this: Intl.NumberFormat,
  start: number,
  end: number
) {
  return FormatNumericRangeToParts(this, start, end, {getInternalSlots})
}

try {
  Object.defineProperty(formatToParts, 'name', {
    value: 'formatToParts',
    enumerable: false,
    writable: false,
    configurable: true,
  })
} catch (e) {
  // In older browser (e.g Chrome 36 like polyfill.io)
  // TypeError: Cannot redefine property: name
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

defineProperty(NumberFormat.prototype, 'resolvedOptions', {
  value: function resolvedOptions() {
    if (typeof this !== 'object' || !OrdinaryHasInstance(NumberFormat, this)) {
      throw TypeError(
        'Method Intl.NumberFormat.prototype.resolvedOptions called on incompatible receiver'
      )
    }
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
    return ro as any
  },
})

const formatDescriptor = {
  enumerable: false,
  configurable: true,
  get(this: NumberFormat) {
    if (typeof this !== 'object' || !OrdinaryHasInstance(NumberFormat, this)) {
      throw TypeError(
        'Intl.NumberFormat format property accessor called on incompatible receiver'
      )
    }
    const internalSlots = getInternalSlots(this as any)
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const numberFormat = this
    let boundFormat = internalSlots.boundFormat
    if (boundFormat === undefined) {
      // https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_diff_out.html#sec-number-format-functions
      boundFormat = (value?: number | bigint) => {
        // TODO: check bigint
        const x = toNumeric(value) as number
        return numberFormat
          .formatToParts(x)
          .map(x => x.value)
          .join('')
      }
      try {
        // https://github.com/tc39/test262/blob/master/test/intl402/NumberFormat/prototype/format/format-function-name.js
        Object.defineProperty(boundFormat, 'name', {
          configurable: true,
          enumerable: false,
          writable: false,
          value: '',
        })
      } catch (e) {
        // In older browser (e.g Chrome 36 like polyfill.io)
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
} catch (e) {
  // In older browser (e.g Chrome 36 like polyfill.io)
  // TypeError: Cannot redefine property: name
}

Object.defineProperty(NumberFormat.prototype, 'format', formatDescriptor)

// Static properties
defineProperty(NumberFormat, 'supportedLocalesOf', {
  value: function supportedLocalesOf(
    locales: string | string[],
    options?: Pick<NumberFormatOptions, 'localeMatcher'>
  ) {
    return SupportedLocales(
      NumberFormat.availableLocales,
      CanonicalizeLocaleList(locales),
      options
    )
  },
})

NumberFormat.__addLocaleData = function __addLocaleData(
  ...data: RawNumberLocaleData[]
) {
  for (const {data: d, locale} of data) {
    const minimizedLocale = new (Intl as any).Locale(locale)
      .minimize()
      .toString()
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

function toNumeric(val: any) {
  if (typeof val === 'bigint') {
    return val
  }
  return ToNumber(val)
}

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
} catch (e) {
  // Meta fix so we're test262-compliant, not important
}
