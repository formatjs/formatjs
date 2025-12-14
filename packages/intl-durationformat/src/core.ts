import {
  CanonicalizeLocaleList,
  GetNumberOption,
  GetOption,
  OrdinaryHasInstance,
  SupportedLocales,
  ToObject,
  invariant,
} from '@formatjs/ecma402-abstract'
import {ResolveLocale} from '@formatjs/intl-localematcher'
import {GetDurationUnitOptions} from './abstract/GetDurationUnitOptions.js'
import {PartitionDurationFormatPattern} from './abstract/PartitionDurationFormatPattern.js'
import {ToDurationRecord} from './abstract/ToDurationRecord.js'
import {getInternalSlots} from './get_internal_slots.js'
import {numberingSystemNames} from './numbering-systems.generated.js'
import {TIME_SEPARATORS} from './time-separators.generated.js'
import type {
  DurationFormatLocaleInternalData,
  DurationFormatPart,
  DurationFormat as DurationFormatType,
  DurationInput,
  IntlDurationFormatInternal,
  ResolvedDurationFormatOptions,
} from './types.js'
import {DurationFormatOptions} from './types.js'

const RESOLVED_OPTIONS_KEYS: Array<
  keyof Omit<IntlDurationFormatInternal, 'pattern' | 'boundFormat'>
> = [
  'locale',
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
  'numberingSystem',
  'fractionalDigits',
]

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

export class DurationFormat implements DurationFormatType {
  constructor(locales?: string | string[], options?: DurationFormatOptions) {
    // test262/test/intl402/ListFormat/constructor/constructor/newtarget-undefined.js
    // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
    const newTarget =
      this && this instanceof DurationFormat ? this.constructor : void 0
    if (!newTarget) {
      throw new TypeError("Intl.DurationFormat must be called with 'new'")
    }
    const requestedLocales = CanonicalizeLocaleList(locales)
    const opt: any = Object.create(null)
    const opts = options === undefined ? Object.create(null) : ToObject(options)
    const matcher = GetOption(
      opts,
      'localeMatcher',
      'string',
      ['best fit', 'lookup'],
      'best fit'
    )
    const numberingSystem = GetOption(
      opts,
      'numberingSystem',
      'string',
      undefined,
      undefined
    )
    if (
      numberingSystem !== undefined &&
      numberingSystemNames.indexOf(numberingSystem) < 0
    ) {
      // 8.a. If numberingSystem does not match the Unicode Locale Identifier type nonterminal,
      // throw a RangeError exception.
      throw RangeError(`Invalid numberingSystems: ${numberingSystem}`)
    }
    opt.nu = numberingSystem
    opt.localeMatcher = matcher
    const {localeData, availableLocales} = DurationFormat
    const r = ResolveLocale(
      availableLocales,
      requestedLocales,
      opt,
      // [[RelevantExtensionKeys]] slot, which is a constant
      ['nu'],
      localeData,
      DurationFormat.getDefaultLocale
    )
    const locale = r.locale
    const internalSlots = getInternalSlots(this)
    internalSlots.initializedDurationFormat = true
    internalSlots.locale = locale
    internalSlots.numberingSystem = r.nu
    const style = GetOption(
      opts,
      'style',
      'string',
      ['long', 'short', 'narrow', 'digital'],
      'short'
    )
    internalSlots.style = style
    internalSlots.dataLocale = r.dataLocale
    let prevStyle = ''
    TABLE_3.forEach(row => {
      const {
        styleSlot,
        displaySlot,
        unit,
        values: valueList,
        digitalDefault: digitalBase,
      } = row
      const unitOptions = GetDurationUnitOptions(
        unit,
        opts,
        style,
        valueList,
        digitalBase,
        prevStyle
      )
      internalSlots[styleSlot] = unitOptions.style
      internalSlots[displaySlot] = unitOptions.display
      if (
        unit === 'hours' ||
        unit === 'minutes' ||
        unit === 'seconds' ||
        unit === 'milliseconds' ||
        unit === 'microseconds'
      ) {
        prevStyle = unitOptions.style
      }
    })
    internalSlots.fractionalDigits = GetNumberOption(
      opts,
      'fractionalDigits',
      0,
      9,
      undefined
    )
  }
  resolvedOptions(): ResolvedDurationFormatOptions {
    if (
      typeof this !== 'object' ||
      !OrdinaryHasInstance(DurationFormat, this)
    ) {
      throw TypeError(
        'Method Intl.DurationFormat.prototype.resolvedOptions called on incompatible receiver'
      )
    }
    const internalSlots = getInternalSlots(this)
    const ro: Record<string, unknown> = {}
    for (const key of RESOLVED_OPTIONS_KEYS) {
      let v = internalSlots[key]
      if (key === 'fractionalDigits') {
        if (v !== undefined) {
          v = Number(v)
        }
      } else {
        invariant(v !== undefined, `Missing internal slot ${key}`)
      }
      ro[key] = v
    }
    return ro as any
  }
  formatToParts(duration: DurationInput): DurationFormatPart[] {
    const locInternalSlots = getInternalSlots(this)
    if (locInternalSlots.initializedDurationFormat === undefined) {
      throw new TypeError('Error uninitialized locale')
    }
    const record = ToDurationRecord(duration)
    const parts = PartitionDurationFormatPattern(this, record)
    const result = []
    for (const {type, unit, value} of parts) {
      const obj: DurationFormatPart = {type, value}
      if (unit) {
        obj.unit = unit
      }
      result.push(obj)
    }
    return result
  }
  format(duration: DurationInput): string {
    const locInternalSlots = getInternalSlots(this)
    if (locInternalSlots.initializedDurationFormat === undefined) {
      throw new TypeError('Error uninitialized locale')
    }
    const record = ToDurationRecord(duration)
    const parts = PartitionDurationFormatPattern(this, record)
    let result = ''
    for (const {value} of parts) {
      result += value
    }
    return result
  }

  static supportedLocalesOf(
    locales: string | string[],
    options?: Pick<DurationFormatOptions, 'localeMatcher'>
  ): string[] {
    return SupportedLocales(
      DurationFormat.availableLocales,
      CanonicalizeLocaleList(locales),
      options as any
    )
  }

  static __defaultLocale = 'en'
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
      const nu: readonly string[] = TIME_SEPARATORS.localeData[locale].nu
      all[locale] = {
        nu,
        digitalFormat:
          TIME_SEPARATORS.localeData[locale as 'da'].separator ||
          nu.reduce<Record<string, string>>((separators, n) => {
            separators[n] = TIME_SEPARATORS.default
            return separators
          }, {}),
      }
      return all
    },
    {}
  )
  static getDefaultLocale = (): string => {
    return DurationFormat.__defaultLocale
  }
  static polyfilled = true
}
