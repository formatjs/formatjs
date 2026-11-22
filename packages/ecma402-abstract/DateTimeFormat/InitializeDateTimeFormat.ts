import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  arrayEvery,
  arrayIncludes,
  arraySome,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {IsUnicodeLocaleIdentifierType} from '#packages/ecma402-abstract/IsUnicodeLocaleIdentifierType.js'
import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {CanonicalizeTimeZoneName} from '#packages/ecma402-abstract/CanonicalizeTimeZoneName.js'
import {GetNumberOption} from '#packages/ecma402-abstract/GetNumberOption.js'
import {GetOption} from '#packages/ecma402-abstract/GetOption.js'
import {IsValidTimeZoneName} from '#packages/ecma402-abstract/IsValidTimeZoneName.js'
import {
  type DateTimeFormat,
  type DateTimeFormatLocaleInternalData,
  type Formats,
  type TemporalDateTimeKind,
  type IntlDateTimeFormatInternal,
  type RangePatterns,
  type TABLE_2,
} from '#packages/ecma402-abstract/types/date-time.js'
import {
  invariant,
  createMemoizedNumberFormatForConstructor,
  getNumberFormatProvider,
  getFormatterPartsMethod,
} from '#packages/ecma402-abstract/utils.js'
import {ResolveLocale} from '@formatjs/intl-localematcher'
import {BasicFormatMatcher} from '#packages/ecma402-abstract/DateTimeFormat/BasicFormatMatcher.js'
import {BestFitFormatMatcher} from '#packages/ecma402-abstract/DateTimeFormat/BestFitFormatMatcher.js'
import {DateTimeStyleFormat} from '#packages/ecma402-abstract/DateTimeFormat/DateTimeStyleFormat.js'
import {CoerceOptionsToObject} from '#packages/ecma402-abstract/CoerceOptionsToObject.js'
import {DATE_TIME_PROPS} from '#packages/ecma402-abstract/DateTimeFormat/utils.js'

const TemporalFormatMap = Map
const temporalFormatMapGet = Map.prototype.get
const temporalFormatMapSet = Map.prototype.set
const temporalFormatApply = Reflect.apply

const rangePatternKeys = Object.keys
const rangePatternStartsWith = String.prototype.startsWith
const rangePatternEndsWith = String.prototype.endsWith
const rangeTextWidthFields = ['weekday', 'month'] as const

function matchRangeWidths(
  ranges: Formats['rangePatterns'],
  format: IntlDateTimeFormatInternal,
  options: Opt
): Formats['rangePatterns'] {
  // Temporal comparison §15.6.5 steps8.a–9.a: private selected format records.
  // https://tc39.es/proposal-temporal/#sec-partitiondatetimepattern
  // CLDR matching adjusts textual date fields; interval time widths stay independent.
  // https://unicode.org/reports/tr35/tr35-dates.html#Matching_Skeletons
  // Temporal comparison §15.4.1 step46.m: adapt private selected-format records.
  // https://tc39.es/proposal-temporal/#sec-createdatetimeformat
  const widths = {__proto__: null} as unknown as Partial<RangePatterns>
  for (let index = 0; index < rangeTextWidthFields.length; index++) {
    const field = rangeTextWidthFields[index]
    const width = format[field]
    if (width === 'narrow' || width === 'short' || width === 'long')
      widths[field] = width
  }
  if (format.era === 'narrow') widths.era = 'narrow'
  if (
    !rangePatternKeys(widths).length &&
    format.timeZoneName === undefined &&
    options.dayPeriod === undefined &&
    options.fractionalSecondDigits === undefined
  )
    return ranges
  const result = {__proto__: null} as unknown as Formats['rangePatterns']
  const fields = rangePatternKeys(ranges) as Array<TABLE_2 | 'default'>
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index]
    const range = ranges[field]
    const zoneWidth =
      range.timeZoneName != null &&
      temporalFormatApply(rangePatternStartsWith, range.timeZoneName, ['long'])
        ? 'long'
        : 'short'
    const timeZoneName = arrayIncludes(['era', 'year', 'month', 'day'], field)
      ? format.timeZoneName
      : range.timeZoneName && format.timeZoneName
        ? (`${zoneWidth}${
            temporalFormatApply(rangePatternEndsWith, format.timeZoneName, [
              'Generic',
            ])
              ? 'Generic'
              : temporalFormatApply(rangePatternEndsWith, format.timeZoneName, [
                    'Offset',
                  ])
                ? 'Offset'
                : ''
          }` as RangePatterns['timeZoneName'])
        : range.timeZoneName
    const adjustedParts: typeof range.patternParts = []
    for (
      let partIndex = 0;
      partIndex < range.patternParts.length;
      partIndex++
    ) {
      const part = range.patternParts[partIndex]
      setDataProperty(adjustedParts, `${partIndex}`, {
        ...part,
        pattern: applyExplicitTimePatternOptions(
          part.pattern,
          options,
          format.locale,
          format.numberingSystem
        ),
      })
    }
    result[field] = {
      ...range,
      ...widths,
      ...(range.weekdayStandalone && range.weekday
        ? {weekday: range.weekday}
        : {}),
      ...(range.month === 'numeric' || range.month === '2-digit'
        ? {month: range.month}
        : {}),
      ...(timeZoneName ? {timeZoneName} : {}),
      ...(options.fractionalSecondDigits !== undefined
        ? {fractionalSecondDigits: options.fractionalSecondDigits}
        : {}),
      ...(options.dayPeriod !== undefined && range.dayPeriod === undefined
        ? {dayPeriod: options.dayPeriod}
        : {}),
      patternParts: adjustedParts,
    }
  }
  return result
}

function isTimeRelated(opt: Opt) {
  for (const prop of ['hour', 'minute', 'second'] as Array<
    keyof Pick<Opt, 'hour' | 'minute' | 'second'>
  >) {
    const value = opt[prop]
    if (value !== undefined) {
      return true
    }
  }
  return false
}

function resolveHourCycle(
  hc: string,
  data: DateTimeFormatLocaleInternalData,
  hour12?: boolean
) {
  // ECMA-402 §11.1.2, steps 13–15: hour12 selects an independent locale
  // preference, rather than deriving h11/h24 from the default cycle.
  // https://tc39.es/ecma402/#sec-createdatetimeformat
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L78-L87
  if (hour12 === true) {
    return (
      data.hourCycle12 ||
      data.hc.find(cycle => cycle === 'h11' || cycle === 'h12') ||
      'h12'
    )
  }
  if (hour12 === false) {
    return (
      data.hourCycle24 ||
      data.hc.find(cycle => cycle === 'h23' || cycle === 'h24') ||
      'h23'
    )
  }
  return hc == null ? data.hourCycle : hc
}

const createTimePatternOptions = Object.create
const timePatternIndexOf = String.prototype.indexOf
const timePatternExec = RegExp.prototype.exec
const timePatternReplace = RegExp.prototype[Symbol.replace]
function timeReplacementPattern(pattern: RegExp): RegExp {
  setDataProperty(pattern, 'exec', timePatternExec)
  setDataProperty(pattern, 'global', true)
  setDataProperty(pattern, 'unicode', false)
  setDataProperty(pattern, 'unicodeSets', false)
  return pattern
}
const secondPlaceholder = timeReplacementPattern(/\{second\}/g)
const dayPeriodPlaceholder = timeReplacementPattern(/\{ampm\}/g)

function applyExplicitTimePatternOptions(
  pattern: string,
  opt: Opt,
  locale: string,
  numberingSystem: string
) {
  if (
    opt.fractionalSecondDigits !== undefined &&
    temporalFormatApply(timePatternIndexOf, pattern, ['{second}']) >= 0 &&
    temporalFormatApply(timePatternIndexOf, pattern, [
      '{fractionalSecondDigits}',
    ]) < 0
  ) {
    // LDML matching skeletons: append the locale's decimal separator before S.
    // https://unicode.org/reports/tr35/tr35-dates.html#Matching_Skeletons
    // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35-dates.md#L834
    // Temporal comparison §15.4.1 step46.m: adapt the selected CLDR time pattern.
    // https://tc39.es/proposal-temporal/#sec-createdatetimeformat
    const numberOptions = createTimePatternOptions(null)
    numberOptions.numberingSystem = numberingSystem
    const NumberFormat = getNumberFormatProvider()
    const numberFormat = createMemoizedNumberFormatForConstructor(NumberFormat)(
      locale,
      numberOptions
    )
    const partsMethod =
      getFormatterPartsMethod<Intl.NumberFormat['formatToParts']>(NumberFormat)
    const parts = temporalFormatApply(
      partsMethod,
      numberFormat,
      [1.1]
    ) as Intl.NumberFormatPart[]
    let decimal: string | undefined
    for (let index = 0; index < parts.length; index++) {
      if (parts[index].type === 'decimal') {
        decimal = parts[index].value
        break
      }
    }
    invariant(
      decimal !== undefined,
      'Missing decimal separator for fractional seconds'
    )
    pattern = temporalFormatApply(timePatternReplace, secondPlaceholder, [
      pattern,
      `{second}${decimal}{fractionalSecondDigits}`,
    ])
  }
  if (opt.dayPeriod !== undefined) {
    pattern = temporalFormatApply(timePatternReplace, dayPeriodPlaceholder, [
      pattern,
      '{dayPeriod}',
    ])
  }
  return pattern
}

interface Opt extends Omit<Formats, 'pattern' | 'pattern12'> {
  localeMatcher: Intl.DateTimeFormatOptions['localeMatcher']
  ca: Intl.DateTimeFormatOptions['calendar']
  nu: Intl.DateTimeFormatOptions['numberingSystem']
  hc: Intl.DateTimeFormatOptions['hourCycle']
}
export interface DateTimeFormatContext {
  required?: 'date' | 'time' | 'any'
  defaults?: 'date' | 'time' | 'all'
  timeZone?: string
}
/**
 * https://tc39.es/ecma402/#sec-createdatetimeformat
 * @param dtf DateTimeFormat
 * @param locales locales
 * @param opts options
 */
export function InitializeDateTimeFormat(
  dtf: Intl.DateTimeFormat | DateTimeFormat,
  locales: string | string[] | undefined,
  opts: Intl.DateTimeFormatOptions | undefined,
  {
    getInternalSlots,
    availableLocales,
    localeData,
    getDefaultLocale,
    getDefaultTimeZone,
    relevantExtensionKeys,
    tzData,
    uppercaseLinks,
    uppercaseIdentifiers,
  }: {
    getInternalSlots(
      dtf: DateTimeFormat | Intl.DateTimeFormat
    ): IntlDateTimeFormatInternal
    availableLocales: Set<string>
    getDefaultLocale(): string
    getDefaultTimeZone(): string
    relevantExtensionKeys: string[]
    localeData: Record<string, DateTimeFormatLocaleInternalData | undefined>
    tzData: Record<string, unknown>
    uppercaseLinks: Record<string, string>
    uppercaseIdentifiers: Record<string, string>
  },
  {
    required = 'any',
    defaults = 'date',
    timeZone: localeTimeZone,
  }: DateTimeFormatContext = {}
): Intl.DateTimeFormat {
  // @ts-ignore
  const requestedLocales: string[] = CanonicalizeLocaleList(locales)
  const options = CoerceOptionsToObject<Intl.DateTimeFormatOptions>(opts)
  let opt: Opt = Object.create(null)
  let matcher = GetOption(
    options,
    'localeMatcher',
    'string',
    ['lookup', 'best fit'],
    'best fit'
  )
  opt.localeMatcher = matcher
  let calendar = GetOption(options, 'calendar', 'string', undefined, undefined)
  if (calendar !== undefined && !IsUnicodeLocaleIdentifierType(calendar)) {
    throw new RangeErrorConstructor('Malformed calendar')
  }
  const internalSlots = getInternalSlots(dtf)
  opt.ca = calendar
  const numberingSystem = GetOption(
    options,
    'numberingSystem',
    'string',
    undefined,
    undefined
  )
  if (
    numberingSystem !== undefined &&
    !IsUnicodeLocaleIdentifierType(numberingSystem)
  ) {
    throw new RangeErrorConstructor('Malformed numbering system')
  }
  opt.nu = numberingSystem
  const hour12 = GetOption(options, 'hour12', 'boolean', undefined, undefined)
  let hourCycle = GetOption(
    options,
    'hourCycle',
    'string',
    ['h11', 'h12', 'h23', 'h24'],
    undefined
  )
  if (hour12 !== undefined) {
    // @ts-ignore
    hourCycle = null
  }
  opt.hc = hourCycle
  const r = ResolveLocale(
    availableLocales,
    requestedLocales,
    opt as any,
    relevantExtensionKeys,
    localeData,
    getDefaultLocale
  )
  internalSlots.locale = r.locale
  calendar = r.ca
  internalSlots.calendar = calendar
  internalSlots.hourCycle = r.hc
  internalSlots.numberingSystem = r.nu
  const {dataLocale} = r
  internalSlots.dataLocale = dataLocale
  let {timeZone} = options
  if (timeZone !== undefined) {
    if (localeTimeZone !== undefined)
      throw new TypeErrorConstructor(
        'timeZone option conflicts with ZonedDateTime'
      )
    timeZone = ToString(timeZone)
    if (
      !IsValidTimeZoneName(timeZone, {
        zoneNamesFromData: Object.keys(tzData),
        uppercaseLinks,
      })
    ) {
      throw new RangeErrorConstructor('Invalid timeZoneName')
    }
  } else {
    timeZone = localeTimeZone ?? getDefaultTimeZone()
  }
  const dataTimeZone =
    CanonicalizeTimeZoneName(timeZone, {
      zoneNames: Object.keys(tzData),
      uppercaseLinks,
    }) ?? timeZone
  // Temporal preserves the supplied identifier; formatting uses its target data.
  // https://tc39.es/proposal-temporal/#sec-intl.datetimeformat
  internalSlots.timeZone =
    uppercaseIdentifiers[timeZone.toUpperCase()] ?? dataTimeZone
  internalSlots.dataTimeZone = dataTimeZone

  opt = Object.create(null)
  opt.weekday = GetOption(
    options,
    'weekday',
    'string',
    ['narrow', 'short', 'long'],
    undefined
  )
  opt.era = GetOption(
    options,
    'era',
    'string',
    ['narrow', 'short', 'long'],
    undefined
  )
  opt.year = GetOption(
    options,
    'year',
    'string',
    ['2-digit', 'numeric'],
    undefined
  )
  opt.month = GetOption(
    options,
    'month',
    'string',
    ['2-digit', 'numeric', 'narrow', 'short', 'long'],
    undefined
  )
  opt.day = GetOption(
    options,
    'day',
    'string',
    ['2-digit', 'numeric'],
    undefined
  )
  opt.dayPeriod = GetOption(
    options,
    'dayPeriod',
    'string',
    ['narrow', 'short', 'long'],
    undefined
  )
  opt.hour = GetOption(
    options,
    'hour',
    'string',
    ['2-digit', 'numeric'],
    undefined
  )
  opt.minute = GetOption(
    options,
    'minute',
    'string',
    ['2-digit', 'numeric'],
    undefined
  )
  opt.second = GetOption(
    options,
    'second',
    'string',
    ['2-digit', 'numeric'],
    undefined
  )
  // ECMA-402 §11.1.2, step 25: read components in table order.
  // https://tc39.es/ecma402/#sec-createdatetimeformat
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L107-L116
  opt.fractionalSecondDigits = GetNumberOption(
    options,
    'fractionalSecondDigits',
    1,
    3,
    undefined
  ) as 1
  opt.timeZoneName = GetOption(
    options,
    'timeZoneName',
    'string',
    [
      'long',
      'short',
      'longOffset',
      'shortOffset',
      'longGeneric',
      'shortGeneric',
    ],
    undefined
  )

  const rootLocaleData = localeData[dataLocale]
  invariant(!!rootLocaleData, `Missing locale data for ${dataLocale}`)
  const dataLocaleData =
    rootLocaleData.calendarData?.[calendar as string] ?? rootLocaleData
  const formats = dataLocaleData.formats[calendar as string]
  // UNSPECCED: IMPLEMENTATION DETAILS
  if (!formats) {
    throw new RangeErrorConstructor(
      `Calendar "${calendar}" is not supported. Try setting "calendar" to 1 of the following: ${Object.keys(
        dataLocaleData.formats
      ).join(', ')}`
    )
  }
  const formatMatcher = GetOption(
    options,
    'formatMatcher',
    'string',
    ['basic', 'best fit'],
    'best fit'
  )
  const dateStyle = GetOption(
    options,
    'dateStyle',
    'string',
    ['full', 'long', 'medium', 'short'],
    undefined
  )
  internalSlots.dateStyle = dateStyle
  const timeStyle = GetOption(
    options,
    'timeStyle',
    'string',
    ['full', 'long', 'medium', 'short'],
    undefined
  )
  internalSlots.timeStyle = timeStyle

  const temporalOptions = {...opt}
  const temporalHourCycle = resolveHourCycle(
    internalSlots.hourCycle,
    dataLocaleData,
    hour12
  )
  let bestFormat
  if (dateStyle === undefined && timeStyle === undefined) {
    // ECMA-402 §11.1.2 CreateDateTimeFormat, step 32.a–d: compute
    // defaults from the already-read fields, without touching options again.
    // https://tc39.es/ecma402/#sec-createdatetimeformat
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L135-L146
    const dateFields = ['weekday', 'year', 'month', 'day'] as const
    const timeFields = [
      'dayPeriod',
      'hour',
      'minute',
      'second',
      'fractionalSecondDigits',
    ] as const
    const relevant =
      required === 'date'
        ? dateFields
        : required === 'time'
          ? timeFields
          : [...dateFields, ...timeFields]
    const needDefaults = arrayEvery(relevant, key => opt[key] === undefined)
    if (needDefaults) {
      if (defaults !== 'time') {
        opt.year = 'numeric'
        opt.month = 'numeric'
        opt.day = 'numeric'
      }
      if (defaults !== 'date') {
        opt.hour = 'numeric'
        opt.minute = 'numeric'
        opt.second = 'numeric'
      }
    }
    if (formatMatcher === 'basic') {
      bestFormat = BasicFormatMatcher(opt, formats)
    } else {
      // IMPL DETAILS START
      if (isTimeRelated(opt)) {
        const hc = resolveHourCycle(
          internalSlots.hourCycle,
          dataLocaleData,
          hour12
        )
        opt.hour12 = hc === 'h11' || hc === 'h12'
      }
      // IMPL DETAILS END
      bestFormat = BestFitFormatMatcher(opt, formats)
    }
  } else {
    for (const prop of DATE_TIME_PROPS) {
      const p = opt[prop]
      if (p !== undefined) {
        throw new TypeErrorConstructor(
          `Intl.DateTimeFormat can't set option ${prop} when ${
            dateStyle ? 'dateStyle' : 'timeStyle'
          } is used`
        )
      }
    }
    if (
      (required === 'date' && timeStyle !== undefined) ||
      (required === 'time' && dateStyle !== undefined)
    )
      throw new TypeErrorConstructor(
        'DateTimeFormat style conflicts with required type'
      )
    // Spec: ECMA-402 11.1.2 CreateDateTimeFormat steps 12-14 resolve
    // hour12 to hc; step 30.5 picks the style format; step 33 stores
    // [[HourCycle]] when the selected format has [[hour]].
    // FormatJS impl detail: pass that resolved 12/24 preference through
    // because our style data is represented as concrete 12/24 patterns.
    const hc =
      timeStyle !== undefined
        ? resolveHourCycle(internalSlots.hourCycle, dataLocaleData, hour12)
        : undefined
    bestFormat = DateTimeStyleFormat(
      dateStyle,
      timeStyle,
      dataLocaleData,
      formats,
      hc !== undefined ? hc === 'h11' || hc === 'h12' : undefined
    )
  }
  // IMPL DETAIL START
  // For debugging
  internalSlots.format = bestFormat
  // IMPL DETAIL END
  for (const prop in opt) {
    const p = bestFormat[prop as 'era']
    if (p !== undefined) {
      internalSlots[prop as 'year'] = p as 'numeric'
    }
  }
  if (opt.dayPeriod !== undefined) {
    internalSlots.dayPeriod = opt.dayPeriod
  }
  if (opt.fractionalSecondDigits !== undefined) {
    internalSlots.fractionalSecondDigits = opt.fractionalSecondDigits
  }
  let pattern
  let rangePatterns
  if (internalSlots.hour !== undefined) {
    const hc = resolveHourCycle(internalSlots.hourCycle, dataLocaleData, hour12)
    internalSlots.hourCycle = hc

    if (hc === 'h11' || hc === 'h12') {
      pattern = bestFormat.pattern12
      rangePatterns = bestFormat.rangePatterns12
    } else {
      pattern = bestFormat.pattern
      rangePatterns = bestFormat.rangePatterns
    }
  } else {
    // @ts-ignore
    internalSlots.hourCycle = undefined
    pattern = bestFormat.pattern
    rangePatterns = bestFormat.rangePatterns
  }
  pattern = applyExplicitTimePatternOptions(
    pattern,
    opt,
    internalSlots.locale,
    internalSlots.numberingSystem
  )
  internalSlots.pattern = pattern
  internalSlots.rangePatterns = matchRangeWidths(
    rangePatterns,
    internalSlots,
    opt
  )
  // Temporal GetDateTimeFormat and AdjustDateTimeStyleFormat use the original
  // component record. Cache variants without rereading the caller's options.
  // https://tc39.es/proposal-temporal/#sec-getdatetimeformat
  // https://tc39.es/proposal-temporal/#sec-adjustdatetimestyleformat
  const temporalFormats = new TemporalFormatMap<
    TemporalDateTimeKind,
    IntlDateTimeFormatInternal
  >()
  internalSlots.getTemporalFormat = kind => {
    // Temporal comparison §§15.6.5 steps5–9, 15.6.7 step1: private kind state.
    const cached = temporalFormatApply(temporalFormatMapGet, temporalFormats, [
      kind,
    ]) as IntlDateTimeFormatInternal | undefined
    if (cached) return cached
    const dateFields = ['weekday', 'year', 'month', 'day'] as const
    const timeFields = [
      'dayPeriod',
      'hour',
      'minute',
      'second',
      'fractionalSecondDigits',
    ] as const
    const allFields = [
      'weekday',
      'year',
      'month',
      'day',
      'dayPeriod',
      'hour',
      'minute',
      'second',
      'fractionalSecondDigits',
    ] as const
    const required =
      kind === 'PlainDate'
        ? dateFields
        : kind === 'PlainYearMonth'
          ? (['year', 'month'] as const)
          : kind === 'PlainMonthDay'
            ? (['month', 'day'] as const)
            : kind === 'PlainTime'
              ? timeFields
              : allFields
    const defaults =
      kind === 'PlainDate'
        ? (['year', 'month', 'day'] as const)
        : kind === 'PlainTime'
          ? (['hour', 'minute', 'second'] as const)
          : kind === 'PlainYearMonth' || kind === 'PlainMonthDay'
            ? required
            : (['year', 'month', 'day', 'hour', 'minute', 'second'] as const)
    const allowed: Array<keyof Opt> = []
    for (let index = 0; index < required.length; index++)
      setDataProperty(allowed, `${index}`, required[index])
    if (kind !== 'PlainTime' && kind !== 'PlainMonthDay')
      setDataProperty(allowed, `${allowed.length}`, 'era')
    if (kind === 'Instant')
      setDataProperty(allowed, `${allowed.length}`, 'timeZoneName')
    const selectedOptions = {__proto__: null} as unknown as Opt
    let selected: Formats
    if (dateStyle !== undefined || timeStyle !== undefined) {
      if (
        (kind === 'PlainTime' && timeStyle === undefined) ||
        ((kind === 'PlainDate' ||
          kind === 'PlainYearMonth' ||
          kind === 'PlainMonthDay') &&
          dateStyle === undefined)
      ) {
        throw new TypeErrorConstructor(
          'DateTimeFormat styles do not overlap the Temporal type'
        )
      }
      for (let index = 0; index < allowed.length; index++) {
        const key = allowed[index]
        setDataProperty(selectedOptions, key, bestFormat[key as keyof Formats])
      }
      const conflicting = arraySome(
        DATE_TIME_PROPS,
        key => bestFormat[key] !== undefined && !arrayIncludes(allowed, key)
      )
      selectedOptions.hour12 =
        temporalHourCycle === 'h11' || temporalHourCycle === 'h12'
      selected = !conflicting
        ? bestFormat
        : formatMatcher === 'basic'
          ? BasicFormatMatcher(selectedOptions, formats)
          : BestFitFormatMatcher(selectedOptions, formats)
    } else {
      for (let index = 0; index < allowed.length; index++) {
        const key = allowed[index]
        setDataProperty(selectedOptions, key, temporalOptions[key])
      }
      if (arrayEvery(required, key => temporalOptions[key] === undefined)) {
        if (
          kind !== 'Instant' &&
          arraySome(allFields, key => temporalOptions[key] !== undefined)
        ) {
          throw new TypeErrorConstructor(
            'DateTimeFormat options do not overlap the Temporal type'
          )
        }
        for (let index = 0; index < defaults.length; index++)
          setDataProperty(selectedOptions, defaults[index], 'numeric')
        if (
          kind === 'Instant' &&
          localeTimeZone !== undefined &&
          selectedOptions.timeZoneName === undefined
        )
          selectedOptions.timeZoneName = 'short'
      }
      selectedOptions.hour12 =
        temporalHourCycle === 'h11' || temporalHourCycle === 'h12'
      selected =
        formatMatcher === 'basic'
          ? BasicFormatMatcher(selectedOptions, formats)
          : BestFitFormatMatcher(selectedOptions, formats)
    }
    const slots = {...internalSlots}
    for (let index = 0; index < DATE_TIME_PROPS.length; index++) {
      const key = DATE_TIME_PROPS[index]
      setDataProperty(slots, key, selected[key])
    }
    if (selectedOptions.dayPeriod !== undefined)
      slots.dayPeriod = selectedOptions.dayPeriod
    if (selectedOptions.fractionalSecondDigits !== undefined)
      slots.fractionalSecondDigits = selectedOptions.fractionalSecondDigits
    slots.hourCycle = temporalHourCycle
    const use12 =
      selected.hour !== undefined &&
      (temporalHourCycle === 'h11' || temporalHourCycle === 'h12')
    slots.pattern = applyExplicitTimePatternOptions(
      use12 ? selected.pattern12 : selected.pattern,
      selectedOptions,
      slots.locale,
      slots.numberingSystem
    )
    slots.rangePatterns = matchRangeWidths(
      use12 ? selected.rangePatterns12 : selected.rangePatterns,
      slots,
      selectedOptions
    )
    slots.format = selected
    temporalFormatApply(temporalFormatMapSet, temporalFormats, [kind, slots])
    return slots
  }
  return dtf as Intl.DateTimeFormat // TODO: remove this when https://github.com/microsoft/TypeScript/pull/50402 is merged
}
