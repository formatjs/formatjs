import {getIntlFallbackSymbol} from '#packages/ecma402-abstract/intl-fallback-symbol.js'
import {invalidateCompactPatterns} from '#packages/ecma402-abstract/NumberFormat/compact-patterns.js'
import {
  canonicalizeLocaleDataTag,
  registerLocaleData,
} from '#packages/ecma402-abstract/registerLocaleData.js'
import {OrdinaryHasInstance} from '#packages/ecma262-abstract/OrdinaryHasInstance.js'
import {IsObject} from '#packages/ecma262-abstract/IsObject.js'
import {
  setDataProperty,
  TypeErrorConstructor,
} from '#packages/ecma262-abstract/intrinsics.js'
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
import {defineProperty} from '#packages/ecma402-abstract/utils.js'
import {currencyDigitsData} from '@formatjs_generated/cldr.number/currency-digits.js'
import {cardinalRules} from '@formatjs_generated/cldr.number/cardinal-rules.js'
import {match} from '@formatjs/intl-localematcher'
import {FormatNumericToString} from '#packages/ecma402-abstract/NumberFormat/FormatNumericToString.js'
import {SetNumberFormatDigitOptions} from '#packages/ecma402-abstract/NumberFormat/SetNumberFormatDigitOptions.js'
import type {NumberFormatDigitInternalSlots} from '#packages/ecma402-abstract/types/number.js'
// eslint-disable-next-line import/no-cycle
import type Decimal from '@formatjs/bigdecimal'
import getInternalSlots, {
  hasInternalSlots,
} from '#packages/intl-numberformat/get_internal_slots.js'
import {
  type NumberFormatConstructor,
  type NumberFormat as NumberFormatType,
} from '#packages/intl-numberformat/types.js'

const objectCreate = Object.create
const objectDefineProperty = Object.defineProperty
const cardinalLocales = Object.keys(cardinalRules)

function unwrapNumberFormat(receiver: unknown): Intl.NumberFormat {
  // ECMA-402 §16.5.9, step 1 requires an Object before checking its legacy wrapper.
  // https://tc39.es/ecma402/#sec-unwrapnumberformat
  if (!IsObject(receiver)) {
    throw new TypeErrorConstructor('Receiver is not an object')
  }
  // Only format and resolvedOptions support legacy wrappers.
  // https://tc39.es/ecma402/#sec-unwrapnumberformat
  if (
    !hasInternalSlots(receiver) &&
    OrdinaryHasInstance(NumberFormat, receiver)
  ) {
    return (receiver as Record<symbol, Intl.NumberFormat>)[
      getIntlFallbackSymbol()
    ]
  }
  return receiver as Intl.NumberFormat
}

// Merge declaration with the constructor defined below.
export type NumberFormat = NumberFormatType

let defaultLocale = ''
function getDefaultLocale(): string {
  return defaultLocale
}

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
function initializeNumberFormat(
  numberFormat: NumberFormat,
  locales?: string | string[],
  options?: NumberFormatOptions
): NumberFormat {
  InitializeNumberFormat(numberFormat as any, locales, options, {
    getInternalSlots: nf => getInternalSlots(nf, true),
    localeData: NumberFormat.localeData,
    availableLocales: NumberFormat.availableLocales,
    getDefaultLocale,
    currencyDigitsData,
  })

  const internalSlots = getInternalSlots(numberFormat as any)

  const dataLocale = internalSlots.dataLocale
  const pluralOptions = {
    __proto__: null,
    minimumFractionDigits: internalSlots.minimumFractionDigits,
    maximumFractionDigits: internalSlots.maximumFractionDigits,
    minimumIntegerDigits: internalSlots.minimumIntegerDigits,
    minimumSignificantDigits: internalSlots.minimumSignificantDigits,
    maximumSignificantDigits: internalSlots.maximumSignificantDigits,
  }
  let pluralDigits: NumberFormatDigitInternalSlots | undefined
  let rule: (typeof cardinalRules)[string] | undefined
  // ECMA-402 §16.5.3, steps 5.b–d and 9.g–k. CLDR names use exact decimal
  // operands, including visible trailing zeros when the rendered value is available.
  // https://tc39.es/ecma402/#sec-partitionnumberpattern
  // https://unicode.org/reports/tr35/tr35-numbers.html#Language_Plural_Rules
  internalSlots.selectPlural = (value, formatted) => {
    if (!value.isFinite()) return 'other'
    if (formatted === undefined) {
      if (!pluralDigits) {
        pluralDigits = objectCreate(null) as NumberFormatDigitInternalSlots
        SetNumberFormatDigitOptions(
          pluralDigits,
          pluralOptions,
          0,
          3,
          'standard'
        )
      }
      formatted = FormatNumericToString(pluralDigits, value).formattedString
    }
    rule ??=
      cardinalRules[dataLocale] ??
      cardinalRules[match([dataLocale], cardinalLocales, 'en')]
    return rule(formatted, false)
  }
  return numberFormat
}

export const NumberFormat = new Proxy(
  function (
    this: NumberFormat,
    locales?: string | string[],
    options?: NumberFormatOptions
  ) {
    const numberFormat = new NumberFormat(locales, options)
    // ECMA-402 §16.1.1.1 steps 1.a–b define the legacy slot after initialization.
    // https://tc39.es/ecma402/#sec-chainnumberformat
    if (OrdinaryHasInstance(NumberFormat, this)) {
      const descriptor = {
        __proto__: null,
        value: numberFormat,
        writable: false,
        enumerable: false,
        configurable: false,
      }
      objectDefineProperty(this, getIntlFallbackSymbol(), descriptor)
      return this
    }
    return numberFormat
  },
  {
    // The private proxy handler has no inherited traps.
    // https://tc39.es/ecma262/#sec-proxy-object-internal-methods-and-internal-slots-get-p-receiver
    __proto__: null,
    construct(_target, args, newTarget) {
      // GetPrototypeFromConstructor reads prototype once, before locale/options.
      // https://tc39.es/ecma262/#sec-getprototypefromconstructor
      const prototype = newTarget.prototype
      const objectPrototype = IsObject(prototype)
        ? prototype
        : NumberFormat.prototype
      return initializeNumberFormat(
        objectCreate(objectPrototype),
        args[0],
        args[1]
      )
    },
  } as ProxyHandler<Function>
) as unknown as NumberFormatConstructor

Object.defineProperty(NumberFormat, 'name', {
  value: 'NumberFormat',
  configurable: true,
})
// ECMA-402 §16.3.1 https://tc39.es/ecma402/#sec-intl.numberformat.prototype.constructor
defineProperty(NumberFormat.prototype, 'constructor', {value: NumberFormat})

// ECMA-402 §7 applies ECMA-262 §18 built-in function requirements: these
// methods have no [[Construct]] or own prototype property.
// https://tc39.es/ecma262/#sec-ecmascript-standard-built-in-objects
const {formatToParts, formatRange, formatRangeToParts} = {
  formatToParts(
    this: Intl.NumberFormat,
    x?: number | bigint | Decimal | string
  ) {
    // ECMA-402 §16.3.6 step 2 precedes argument conversion in step 3.
    // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.formattoparts
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
    // ECMA-402 §16.3.4 steps 3–5 reject missing endpoints, then coerce in order.
    // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.formatrange
    if (start === undefined || end === undefined) {
      throw new TypeErrorConstructor('Range endpoints must not be undefined')
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
    // ECMA-402 §16.3.5 steps 3–5 reject missing endpoints, then coerce in order.
    // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.formatrangetoparts
    if (start === undefined || end === undefined) {
      throw new TypeErrorConstructor('Range endpoints must not be undefined')
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
    const internalSlots = getInternalSlots(unwrapNumberFormat(this))
    const ro: Record<string, unknown> = {}
    // ECMA-402 §16.3.2 step 5 creates own properties in table order.
    // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.resolvedoptions
    for (let index = 0; index < RESOLVED_OPTIONS_KEYS.length; index++) {
      const key = RESOLVED_OPTIONS_KEYS[index]
      const value = internalSlots[key]
      if (value !== undefined) {
        setDataProperty(ro, key, value)
      }
    }
    const {roundingType, trailingZeroDisplay} = internalSlots
    const roundingPriority =
      roundingType === 'morePrecision' || roundingType === 'lessPrecision'
        ? roundingType
        : 'auto'
    setDataProperty(ro, 'roundingPriority', roundingPriority)
    setDataProperty(ro, 'trailingZeroDisplay', trailingZeroDisplay)
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
    const internalSlots = getInternalSlots(unwrapNumberFormat(this))
    let boundFormat = internalSlots.boundFormat
    if (boundFormat === undefined) {
      // ECMA-402 §16.3.3 steps 4–5 cache a built-in with an empty name.
      // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.format
      boundFormat = (
        value?:
          | number
          | bigint
          | `${number}`
          | 'Infinity'
          | '-Infinity'
          | '+Infinity'
      ) => FormatNumeric(internalSlots, ToIntlMathematicalValue(value))

      const descriptor = {
        __proto__: null,
        configurable: true,
        enumerable: false,
        writable: false,
        value: '',
      }
      objectDefineProperty(boundFormat, 'name', descriptor)
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
    // ECMA-402 §16.2.2 https://tc39.es/ecma402/#sec-intl.numberformat.supportedlocalesof
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
  for (const {data: source, locale: tag} of data) {
    const locale = canonicalizeLocaleDataTag(tag)
    const d = source.numbers.aliases
      ? {
          ...source,
          numbers: {
            ...source.numbers,
            symbols: {...source.numbers.symbols},
            decimal: {...source.numbers.decimal},
            percent: {...source.numbers.percent},
            currency: {...source.numbers.currency},
          },
        }
      : source
    // Resolve generated aliases without changing the caller's locale data.
    for (const system of Object.keys(source.numbers.aliases || {})) {
      const target = source.numbers.aliases![system]
      d.numbers.symbols[system] = d.numbers.symbols[target]
      d.numbers.decimal[system] = d.numbers.decimal[target]
      d.numbers.percent[system] = d.numbers.percent[target]
      d.numbers.currency[system] = d.numbers.currency[target]
    }
    // Re-registration refreshes metadata even when a caller reuses its payload.
    const compactTables = new Set<
      Parameters<typeof invalidateCompactPatterns>[0]
    >()
    for (const system of Object.keys(source.numbers.decimal)) {
      compactTables.add(source.numbers.decimal[system].short)
      compactTables.add(source.numbers.decimal[system].long)
    }
    for (const table of compactTables) invalidateCompactPatterns(table)
    registerLocaleData(
      locale,
      d,
      NumberFormat.localeData,
      NumberFormat.availableLocales
    )
    if (!defaultLocale) {
      defaultLocale = locale
    }
  }
}

NumberFormat.__addUnitData = function __addUnitData(
  tag: string,
  unitsData: RawNumberLocaleData['data']['units']
) {
  const locale = canonicalizeLocaleDataTag(tag)
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

// ECMA-402 §9.2.7 step 3 uses the internal default during locale resolution.
// https://tc39.es/ecma402/#sec-resolvelocale
objectDefineProperty(NumberFormat, '__defaultLocale', {
  configurable: true,
  enumerable: true,
  get: getDefaultLocale,
  set(locale: string) {
    defaultLocale = locale
  },
})
// ECMA-402 §16.2.3: registered locale data supplies [[AvailableLocales]] and [[LocaleData]].
// https://tc39.es/ecma402/#sec-intl.numberformat-internal-slots
NumberFormat.localeData = {}
NumberFormat.availableLocales = new Set<string>()
NumberFormat.getDefaultLocale = getDefaultLocale
NumberFormat.polyfilled = true

try {
  // ECMA-402 §16.3.7 https://tc39.es/ecma402/#sec-intl.numberformat.prototype-%symbol.tostringtag%
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

  // ECMA-402 §16.2.1 https://tc39.es/ecma402/#sec-intl.numberformat.prototype
  Object.defineProperty(NumberFormat, 'prototype', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: NumberFormat.prototype,
  })
} catch {
  // Meta fix so we're test262-compliant, not important
}
