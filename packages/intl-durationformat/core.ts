import {numberingSystemNames} from '@formatjs_generated/cldr.number/numbering-systems.js'
import {IsUnicodeLocaleIdentifierType} from '#packages/ecma402-abstract/IsUnicodeLocaleIdentifierType.js'
// Core implementation of Intl.DurationFormat polyfill
// Follows the TC39 Intl.DurationFormat proposal specification

import {
  setDataProperty,
  numberFrom,
  createFromConstructor,
  nullClassBase,
  RangeErrorConstructor,
} from '#packages/ecma262-abstract/intrinsics.js'
import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {GetNumberOption} from '#packages/ecma402-abstract/GetNumberOption.js'
import {GetOption} from '#packages/ecma402-abstract/GetOption.js'
import {GetOptionsObject} from '#packages/ecma402-abstract/GetOptionsObject.js'
import {SupportedLocales} from '#packages/ecma402-abstract/SupportedLocales.js'
import {
  getNumberFormatProvider,
  invariant,
} from '#packages/ecma402-abstract/utils.js'
import {ResolveLocale} from '@formatjs/intl-localematcher'
import {GetDurationUnitOptions} from '#packages/ecma402-abstract/DurationFormat/GetDurationUnitOptions.js'
import {
  PartitionDurationFormatPattern,
  initializeDurationFormatProviders,
} from '#packages/intl-durationformat/abstract/PartitionDurationFormatPattern.js'
import {
  ToTemporalDurationRecord,
  registerTemporalDurationNamespace,
  type TemporalDurationNamespace,
} from '#packages/ecma402-abstract/DurationFormat/ToTemporalDurationRecord.js'
import {
  getInternalSlots,
  requireInternalSlots,
} from '#packages/intl-durationformat/get_internal_slots.js'
import {TIME_SEPARATORS} from '@formatjs_generated/cldr.number/time-separators.js'
import type {
  DurationFormatLocaleInternalData,
  DurationFormatPart,
  DurationFormat as DurationFormatType,
  DurationInput,
  IntlDurationFormatInternal,
  ResolvedDurationFormatOptions,
} from '#packages/intl-durationformat/types.js'
import {type DurationFormatOptions} from '#packages/intl-durationformat/types.js'

// NumberFormat is a runtime dependency and may be replaced by its polyfill.
let defaultLocale = 'en'
function getDefaultLocale(): string {
  return defaultLocale
}

const numberingSystemsByConstructor = new WeakMap<
  typeof Intl.NumberFormat,
  string[]
>()
const getNumberingSystems = numberingSystemsByConstructor.get.bind(
  numberingSystemsByConstructor
)
const setNumberingSystems = numberingSystemsByConstructor.set.bind(
  numberingSystemsByConstructor
)
const createObject = Object.create
const hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty)
const providerApply = Reflect.apply
const providerDescriptor = Object.getOwnPropertyDescriptor
const providerPrototype = Object.getPrototypeOf
const resolvedMethods = new WeakMap<
  object,
  typeof Intl.NumberFormat.prototype.resolvedOptions
>()
const getResolvedMethod = resolvedMethods.get.bind(resolvedMethods)
const setResolvedMethod = resolvedMethods.set.bind(resolvedMethods)
function numberFormatResolvedOptions(Constructor: typeof Intl.NumberFormat) {
  let prototype = Constructor.prototype
  while (prototype !== null) {
    const cached = getResolvedMethod(prototype)
    if (cached) return cached
    const descriptor = providerDescriptor(prototype, 'resolvedOptions')
    const value = descriptor && providerDescriptor(descriptor, 'value')
    if (typeof value?.value === 'function') {
      const method =
        value.value as typeof Intl.NumberFormat.prototype.resolvedOptions
      setResolvedMethod(prototype, method)
      return method
    }
    prototype = providerPrototype(prototype)
  }
  return undefined
}
const initialNumberFormat = getNumberFormatProvider()
if (typeof initialNumberFormat === 'function')
  numberFormatResolvedOptions(initialNumberFormat)

const NumberingSet = Set
const numberingAdd = Set.prototype.add
const numberingValues = Set.prototype.values
const numberingNext = providerPrototype(new NumberingSet().values()).next
function numberingUnion(
  first: readonly string[],
  second: readonly string[]
): string[] {
  const unique = new NumberingSet<string>()
  for (let index = 0; index < first.length; index++)
    providerApply(numberingAdd, unique, [first[index]])
  for (let index = 0; index < second.length; index++)
    providerApply(numberingAdd, unique, [second[index]])
  const iterator = providerApply(numberingValues, unique, [])
  const result: string[] = []
  for (;;) {
    const next = providerApply(
      numberingNext,
      iterator,
      []
    ) as IteratorResult<string>
    if (next.done) return result
    setDataProperty(result, `${result.length}`, next.value)
  }
}

function supportedNumberingSystems(): string[] {
  const NumberFormat = getNumberFormatProvider()
  let systems = getNumberingSystems(NumberFormat)
  if (!systems) {
    systems = []
    const resolvedOptions = numberFormatResolvedOptions(NumberFormat)
    for (let index = 0; index < numberingSystemNames.length; index++) {
      const numberingSystem = numberingSystemNames[index]
      const options = createObject(null)
      options.numberingSystem = numberingSystem
      try {
        if (
          resolvedOptions &&
          providerApply(resolvedOptions, new NumberFormat('en', options), [])
            .numberingSystem === numberingSystem
        )
          setDataProperty(systems, `${systems.length}`, numberingSystem)
      } catch {
        // Missing provider locale data remains retryable on the next call.
      }
    }
    // Missing NumberFormat locale data may be loaded before the next call.
    if (systems.length) setNumberingSystems(NumberFormat, systems)
  }
  return systems
}

// Keys that should be included in resolvedOptions() output
// These represent all the configurable options for duration formatting
const RESOLVED_OPTIONS_KEYS: Array<
  keyof Omit<IntlDurationFormatInternal, 'pattern' | 'boundFormat'>
> = [
  'locale',
  'numberingSystem',
  'style',
  'years',
  'yearsDisplay',
  'months',
  'monthsDisplay',
  'weeks',
  'weeksDisplay',
  'days',
  'daysDisplay',
  'hours',
  'hoursDisplay',
  'minutes',
  'minutesDisplay',
  'seconds',
  'secondsDisplay',
  'milliseconds',
  'millisecondsDisplay',
  'microseconds',
  'microsecondsDisplay',
  'nanoseconds',
  'nanosecondsDisplay',
  'fractionalDigits',
]

// Configuration table for all duration units (from spec Table 3)
// Defines the style and display options for each unit, along with their defaults
// Units are processed in order from largest (years) to smallest (nanoseconds)
const TABLE_3 = [
  {
    styleSlot: 'years',
    displaySlot: 'yearsDisplay',
    unit: 'years',
    values: ['long', 'short', 'narrow'],
    digitalDefault: 'short',
  },
  {
    styleSlot: 'months',
    displaySlot: 'monthsDisplay',
    unit: 'months',
    values: ['long', 'short', 'narrow'],
    digitalDefault: 'short',
  },
  {
    styleSlot: 'weeks',
    displaySlot: 'weeksDisplay',
    unit: 'weeks',
    values: ['long', 'short', 'narrow'],
    digitalDefault: 'short',
  },
  {
    styleSlot: 'days',
    displaySlot: 'daysDisplay',
    unit: 'days',
    values: ['long', 'short', 'narrow'],
    digitalDefault: 'short',
  },
  {
    styleSlot: 'hours',
    displaySlot: 'hoursDisplay',
    unit: 'hours',
    values: ['long', 'short', 'narrow', 'numeric', '2-digit'],
    digitalDefault: 'numeric',
  },
  {
    styleSlot: 'minutes',
    displaySlot: 'minutesDisplay',
    unit: 'minutes',
    values: ['long', 'short', 'narrow', 'numeric', '2-digit'],
    digitalDefault: 'numeric',
  },
  {
    styleSlot: 'seconds',
    displaySlot: 'secondsDisplay',
    unit: 'seconds',
    values: ['long', 'short', 'narrow', 'numeric', '2-digit'],
    digitalDefault: 'numeric',
  },
  {
    styleSlot: 'milliseconds',
    displaySlot: 'millisecondsDisplay',
    unit: 'milliseconds',
    values: ['long', 'short', 'narrow', 'numeric'],
    digitalDefault: 'numeric',
  },
  {
    styleSlot: 'microseconds',
    displaySlot: 'microsecondsDisplay',
    unit: 'microseconds',
    values: ['long', 'short', 'narrow', 'numeric'],
    digitalDefault: 'numeric',
  },
  {
    styleSlot: 'nanoseconds',
    displaySlot: 'nanosecondsDisplay',
    unit: 'nanoseconds',
    values: ['long', 'short', 'narrow', 'numeric'],
    digitalDefault: 'numeric',
  },
] as const

/**
 * DurationFormat provides locale-sensitive duration formatting
 * Implements the Intl.DurationFormat API from the TC39 proposal
 */
// ECMA-402 §13.2.1 https://tc39.es/ecma402/#sec-Intl.DurationFormat.prototype
// ECMA-402 §13.3.1 https://tc39.es/ecma402/#sec-Intl.DurationFormat.prototype.constructor
export class DurationFormat
  extends nullClassBase
  implements DurationFormatType
{
  static __addTemporalNamespace(namespace: TemporalDurationNamespace): void {
    registerTemporalDurationNamespace(namespace)
  }
  // @ts-expect-error TS2377: extends null and returns its own receiver.
  // oxlint-disable-next-line constructor-super -- The constructor returns its allocated receiver.
  constructor(locales?: string | string[], options?: DurationFormatOptions) {
    const receiver = createFromConstructor(new.target, DurationFormat.prototype)
    // Canonicalize the requested locales into a standard format
    const requestedLocales = CanonicalizeLocaleList(locales)
    const opt: any = createObject(null)
    // ECMA-402 §9.2.8, step 3. DurationFormat uses GetOptionsObject.
    // https://tc39.es/ecma402/#sec-resolveoptions
    const opts = GetOptionsObject(options)

    // Get locale matching algorithm preference ('best fit' or 'lookup')
    const matcher = GetOption(
      opts,
      'localeMatcher',
      'string',
      ['best fit', 'lookup'],
      'best fit'
    )

    // Get numbering system (e.g., 'latn', 'arab', 'deva')
    const numberingSystem = GetOption(
      opts,
      'numberingSystem',
      'string',
      undefined,
      undefined
    )
    if (
      numberingSystem !== undefined &&
      !IsUnicodeLocaleIdentifierType(numberingSystem)
    ) {
      // ResolveOptions step 6.d.ii rejects malformed Unicode types.
      // ECMA-402 §9.2.8 ResolveOptions, step 6.d.ii.
      // https://tc39.es/ecma402/#sec-resolveoptions
      throw RangeErrorConstructor(
        `Invalid numberingSystems: ${numberingSystem}`
      )
    }
    opt.nu = numberingSystem
    opt.localeMatcher = matcher
    // Resolve the best matching locale from available locales
    const {localeData, availableLocales} = DurationFormat
    const r = ResolveLocale(
      availableLocales,
      requestedLocales,
      opt,
      // [[RelevantExtensionKeys]] slot - only 'nu' (numbering system) is supported
      ['nu'],
      localeData,
      getDefaultLocale,
      'hostDefaultWithLocaleData'
    )
    const locale = r.locale

    // Initialize internal slots for this formatter instance
    const internalSlots = getInternalSlots(receiver)
    internalSlots.initializedDurationFormat = true
    internalSlots.locale = locale
    internalSlots.numberingSystem = r.nu
    internalSlots.dataLocale = r.dataLocale
    // Steps 7–10 capture separators before reading style or per-unit options.
    const digitalFormat = r.localeData?.digitalFormat
    invariant(!!digitalFormat, `Invalid locale ${r.dataLocale}`)
    const separator = hasOwn(digitalFormat, r.nu)
      ? digitalFormat[r.nu]
      : digitalFormat.default
    internalSlots.hourMinuteSeparator = separator
    internalSlots.minuteSecondSeparator = separator

    // Get overall formatting style: 'long' (3 hours), 'short' (3 hr), 'narrow' (3h), or 'digital' (3:00:00)
    const style = GetOption(
      opts,
      'style',
      'string',
      ['long', 'short', 'narrow', 'digital'],
      'short'
    )
    internalSlots.style = style
    // Process each duration unit (years through nanoseconds) to determine
    // its display style and when to show it (always/auto/never)
    let prevStyle = ''
    const unitStyles: Record<(typeof TABLE_3)[number]['styleSlot'], string> =
      internalSlots
    // ECMA-402 §13.1.1: Table3 is a private List.
    for (let index = 0; index < TABLE_3.length; index++) {
      const row = TABLE_3[index]
      const {
        styleSlot,
        displaySlot,
        unit,
        values: valueList,
        digitalDefault: digitalBase,
      } = row
      // Get the style and display options for this unit
      const unitOptions = GetDurationUnitOptions(
        unit,
        opts,
        style,
        valueList,
        digitalBase,
        prevStyle
      )
      unitStyles[styleSlot] = unitOptions.style
      internalSlots[displaySlot] = unitOptions.display

      // Track the previous style for time units (hours through microseconds)
      // This is used to ensure consistent digital formatting across related units
      if (
        unit === 'hours' ||
        unit === 'minutes' ||
        unit === 'seconds' ||
        unit === 'milliseconds' ||
        unit === 'microseconds'
      ) {
        prevStyle = unitOptions.style
      }
    }

    // Get the number of fractional digits for sub-second precision (0-9)
    internalSlots.fractionalDigits = GetNumberOption(
      opts,
      'fractionalDigits',
      0,
      9,
      undefined
    )
    initializeDurationFormatProviders(receiver)
    return receiver
  }
  resolvedOptions(): ResolvedDurationFormatOptions {
    const internalSlots = requireInternalSlots(this)
    const ro: Record<string, unknown> = {}
    // ECMA-402 §13.3.2, step 4: emit defined values in table order.
    // https://tc39.es/ecma402/#sec-Intl.DurationFormat.prototype.resolvedOptions
    for (let index = 0; index < RESOLVED_OPTIONS_KEYS.length; index++) {
      const key = RESOLVED_OPTIONS_KEYS[index]
      let v = internalSlots[key]
      if (key === 'fractionalDigits') {
        if (v === undefined) continue
        v = numberFrom(v)
      } else if (v === 'fractional') {
        v = 'numeric'
      } else {
        invariant(v !== undefined, `Missing internal slot ${key}`)
      }
      setDataProperty(ro, key, v)
    }
    return ro as any
  }
  formatToParts(duration: DurationInput | string): DurationFormatPart[] {
    // ECMA-402 §13.3.4: require slots, convert input, then create fresh parts.
    // https://tc39.es/ecma402/#sec-Intl.DurationFormat.prototype.formatToParts
    requireInternalSlots(this)
    const record = ToTemporalDurationRecord(duration)
    const parts = PartitionDurationFormatPattern(this, record)
    const result: DurationFormatPart[] = []
    for (let index = 0; index < parts.length; index++) {
      const {type, unit, value} = parts[index]
      const obj: DurationFormatPart = {type, value}
      if (unit) {
        setDataProperty(obj, 'unit', unit)
      }
      setDataProperty(result, `${result.length}`, obj)
    }
    return result
  }
  format(duration: DurationInput | string): string {
    // ECMA-402 §13.3.3: require slots, convert input, then concatenate part values.
    // https://tc39.es/ecma402/#sec-Intl.DurationFormat.prototype.format
    requireInternalSlots(this)
    const record = ToTemporalDurationRecord(duration)
    const parts = PartitionDurationFormatPattern(this, record)
    let result = ''
    for (let index = 0; index < parts.length; index++) {
      result += parts[index].value
    }
    return result
  }

  static supportedLocalesOf(
    locales: string | string[],
    options?: Pick<DurationFormatOptions, 'localeMatcher'>
  ): string[] {
    // ECMA-402 §13.2.2 https://tc39.es/ecma402/#sec-Intl.DurationFormat.supportedLocalesOf
    return SupportedLocales(
      DurationFormat.availableLocales,
      CanonicalizeLocaleList(locales),
      options as any
    )
  }

  declare static __defaultLocale: string
  static availableLocales: Set<string> = new Set<string>()
  static localeData: Record<
    string,
    DurationFormatLocaleInternalData | undefined
  > = (
    Object.keys(TIME_SEPARATORS.localeData) as Array<
      keyof (typeof TIME_SEPARATORS)['localeData']
    >
  ).reduce<Record<string, DurationFormatLocaleInternalData | undefined>>(
    (all, locale) => {
      DurationFormat.availableLocales.add(locale)
      all[locale] = {
        // ECMA-402 §13.2.3 [[LocaleData]] constraints (not algorithm steps):
        // expose numbering systems supported by the NumberFormat dependency.
        // https://tc39.es/ecma402/#sec-Intl.DurationFormat-internal-slots
        get nu() {
          const defaults = TIME_SEPARATORS.localeData[locale].nu
          return numberingUnion(defaults, supportedNumberingSystems())
        },
        digitalFormat: {
          default: TIME_SEPARATORS.default,
          ...TIME_SEPARATORS.localeData[locale as 'da'].separator,
        },
      }
      return all
    },
    {}
  )
  static getDefaultLocale: () => string = getDefaultLocale
  static polyfilled = true
}

// ECMA-402 §9.2.7 step 3 uses the internal default during locale resolution.
// https://tc39.es/ecma402/#sec-resolvelocale
Object.defineProperty(DurationFormat, '__defaultLocale', {
  configurable: true,
  enumerable: true,
  get: getDefaultLocale,
  set(locale: string) {
    defaultLocale = locale
  },
})

// ECMA-402 §13.1.1 and §13.2.2: lengths count required parameters.
// https://tc39.es/ecma402/#sec-Intl.DurationFormat
// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/durationformat.html#L141
Object.defineProperty(DurationFormat, 'length', {value: 0, configurable: true})
Object.defineProperty(DurationFormat.supportedLocalesOf, 'length', {
  value: 1,
  configurable: true,
})
// ECMA-402 §13.3.5: the prototype exposes the specified toStringTag descriptor.
// https://tc39.es/ecma402/#sec-Intl.DurationFormat.prototype-%symbol.tostringtag%
Object.setPrototypeOf(DurationFormat.prototype, Object.prototype)

Object.defineProperty(DurationFormat.prototype, Symbol.toStringTag, {
  value: 'Intl.DurationFormat',
  configurable: true,
})
