import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  arrayEvery,
  arrayIncludes,
  arraySome,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
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
  getNumberFormatIntrinsic,
  getFormatterPartsMethod,
} from '#packages/ecma402-abstract/utils.js'
import {ResolveLocale} from '@formatjs/intl-localematcher'
import {BasicFormatMatcher} from '#packages/ecma402-abstract/DateTimeFormat/BasicFormatMatcher.js'
import {BestFitFormatMatcher} from '#packages/ecma402-abstract/DateTimeFormat/BestFitFormatMatcher.js'
import {
  DateTimeStyleFormat,
  DateWithTimeZoneFormat,
} from '#packages/ecma402-abstract/DateTimeFormat/DateTimeStyleFormat.js'
import {CoerceOptionsToObject} from '#packages/ecma402-abstract/CoerceOptionsToObject.js'
import {
  calendarLocaleData,
  DATE_TIME_PROPS,
} from '#packages/ecma402-abstract/DateTimeFormat/utils.js'

const TemporalFormatMap = Map
const temporalFormatMapGet = Map.prototype.get
const temporalFormatMapSet = Map.prototype.set
const temporalFormatApply = Reflect.apply

const objectKeys = Object.keys
const timeZoneUpperCase = String.prototype.toUpperCase
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
  const standaloneWeekday =
    HasOwnProperty(format.format, 'weekdayStandalone') &&
    format.format.weekdayStandalone
  const widths = {__proto__: null} as unknown as Partial<RangePatterns>
  for (let index = 0; index < rangeTextWidthFields.length; index++) {
    const field = rangeTextWidthFields[index]
    const width = format[field]
    if (width === 'narrow' || width === 'short' || width === 'long')
      widths[field] = width
  }
  if (format.era === 'narrow') widths.era = 'narrow'
  if (
    !objectKeys(widths).length &&
    format.timeZoneName === undefined &&
    options.dayPeriod === undefined &&
    options.fractionalSecondDigits === undefined
  )
    return ranges
  const result = {__proto__: null} as unknown as Formats['rangePatterns']
  const fields = objectKeys(ranges) as Array<TABLE_2 | 'default'>
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
      __proto__: null,
      ...range,
      ...widths,
      // Keep the interval's width when its weekday form differs from the single pattern.
      ...(range.weekdayStandalone && !standaloneWeekday && range.weekday
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
    } as RangePatterns
  }
  return result
}

function isTimeRelated(opt: Pick<Opt, 'hour' | 'minute' | 'second'>) {
  return (
    opt.hour !== undefined ||
    opt.minute !== undefined ||
    opt.second !== undefined
  )
}

function matchComponents(
  options: Opt,
  formats: Formats[],
  data: DateTimeFormatLocaleInternalData,
  matcher: string
): Formats {
  const match = matcher === 'basic' ? BasicFormatMatcher : BestFitFormatMatcher
  const zone = options.timeZoneName
  // ECMA-402 §11.1.2 step 32.g–h matches components after defaults.
  // https://tc39.es/ecma402/#sec-createdatetimeformat
  if (
    zone &&
    !isTimeRelated(options) &&
    options.dayPeriod === undefined &&
    options.fractionalSecondDigits === undefined
  ) {
    const dates: Formats[] = []
    for (let i = 0; i < formats.length; i++) {
      const candidate = formats[i]
      if (
        !isTimeRelated(candidate) &&
        candidate.dayPeriod === undefined &&
        candidate.fractionalSecondDigits === undefined &&
        candidate.timeZoneName === undefined
      )
        setDataProperty(dates, dates.length, candidate)
    }
    if (dates.length) {
      // §11.5.2 step 10.c keeps the first format on a tie.
      // https://tc39.es/ecma402/#sec-basicformatmatcher
      const supplementalFormat = DateWithTimeZoneFormat(
        match(options, dates),
        zone,
        data
      )
      return match(options, formats, supplementalFormat)
    }
  }
  return match(options, formats)
}

function resolveHourCycle(
  hc: string,
  data: DateTimeFormatLocaleInternalData,
  hour12?: boolean
) {
  // ECMA-402 §11.1.2 steps 15–17 use separate locale preferences for hour12.
  // https://tc39.es/ecma402/#sec-createdatetimeformat
  if (hour12 === undefined) return hc ?? data.hourCycle ?? 'h23'
  const preference = hour12 ? 'hourCycle12' : 'hourCycle24'
  const preferred = HasOwnProperty(data, preference)
    ? data[preference]
    : undefined
  if (preferred) return preferred

  // Older packs store the preference in the ordered list of supported cycles.
  const cycles = data.hc
  for (let index = 0; index < cycles.length; index++) {
    const cycle = cycles[index]
    if (cycle === null) continue
    if (
      hour12
        ? cycle === 'h11' || cycle === 'h12'
        : cycle === 'h23' || cycle === 'h24'
    )
      return cycle
  }
  return hour12 ? 'h12' : 'h23'
}

const createObject = Object.create
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
    const numberOptions = createObject(null)
    numberOptions.numberingSystem = numberingSystem
    const NumberFormat = getNumberFormatIntrinsic()
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
  // ECMA-402 §11.1.2 steps 2–14 and §9.2.8 steps 1–8 resolve locale options.
  // https://tc39.es/ecma402/#sec-createdatetimeformat
  // https://tc39.es/ecma402/#sec-resolveoptions
  // @ts-ignore
  const requestedLocales: string[] = CanonicalizeLocaleList(locales)
  const options = CoerceOptionsToObject<Intl.DateTimeFormatOptions>(opts)
  let opt: Opt = createObject(null)
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
    getDefaultLocale,
    'hostDefaultWithLocaleData'
  )
  internalSlots.locale = r.locale
  calendar = r.ca
  internalSlots.calendar = calendar
  internalSlots.numberingSystem = r.nu
  const {dataLocale} = r
  internalSlots.dataLocale = dataLocale
  // ECMA-402 §11.1.2 step 13 retains the resolved locale data before option reads.
  // https://tc39.es/ecma402/#sec-createdatetimeformat
  const rootLocaleData = r.localeData
  invariant(!!rootLocaleData, `Missing locale data for ${dataLocale}`)
  // ECMA-402 §11.1.2 steps 15–17 resolve the cycle from locale-wide preferences.
  // https://tc39.es/ecma402/#sec-createdatetimeformat
  const resolvedHourCycle = resolveHourCycle(r.hc, rootLocaleData, hour12)
  const uses12HourCycle =
    resolvedHourCycle === 'h11' || resolvedHourCycle === 'h12'
  // ECMA-402 §11.1.2 steps 18–21 resolve the default, named, or offset zone.
  // https://tc39.es/ecma402/#sec-createdatetimeformat
  // The Stage 4 integration reads the option before querying the host zone,
  // matching native Intl when the option getter changes the host setting.
  // https://github.com/tc39/ecma402/pull/1044
  // Temporal §15.4.1 also checks for a conflicting ZonedDateTime zone.
  // https://tc39.es/proposal-temporal/#sec-createdatetimeformat
  let {timeZone} = options
  if (timeZone !== undefined) {
    if (localeTimeZone !== undefined)
      throw new TypeErrorConstructor(
        'timeZone option conflicts with ZonedDateTime'
      )
    timeZone = ToString(timeZone)
    if (
      !IsValidTimeZoneName(timeZone, {
        zoneNamesFromData: objectKeys(tzData),
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
      zoneNames: objectKeys(tzData),
      uppercaseLinks,
    }) ?? timeZone
  // ECMA-402 §11.1.2 steps 19.g and 20.c resolve offsets and named zones.
  // https://tc39.es/ecma402/#sec-createdatetimeformat
  // Stage 4 Temporal preserves the supplied identifier and uses its target data.
  // https://github.com/tc39/ecma402/pull/1044
  internalSlots.timeZone = dataTimeZone
  if (timeZone[0] !== '+' && timeZone[0] !== '-') {
    const identifier = temporalFormatApply(timeZoneUpperCase, timeZone, [])
    if (HasOwnProperty(uppercaseIdentifiers, identifier))
      internalSlots.timeZone = uppercaseIdentifiers[identifier]
  }
  internalSlots.dataTimeZone = dataTimeZone

  // ECMA-402 §11.1.2 steps 22–25 read components in Table 16 order.
  // https://tc39.es/ecma402/#sec-createdatetimeformat
  opt = createObject(null)
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

  const dataLocaleData = calendarLocaleData(rootLocaleData, calendar as string)
  const formats = dataLocaleData.formats[calendar as string]
  // UNSPECCED: IMPLEMENTATION DETAILS
  if (!formats) {
    throw new RangeErrorConstructor(
      `Calendar "${calendar}" is not supported. Try setting "calendar" to 1 of the following: ${Object.keys(
        dataLocaleData.formats
      ).join(', ')}`
    )
  }
  // ECMA-402 §11.1.2 steps 26–30 read the matcher and styles in order.
  // https://tc39.es/ecma402/#sec-createdatetimeformat
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
  let bestFormat
  if (dateStyle === undefined && timeStyle === undefined) {
    // ECMA-402 §11.1.2 step 32.a–f computes defaults from the private fields.
    const dateFields = ['weekday', 'year', 'month', 'day'] as const
    const timeFields = [
      'dayPeriod',
      'hour',
      'minute',
      'second',
      'fractionalSecondDigits',
    ] as const
    const needDefaults =
      (required === 'time' ||
        arrayEvery(dateFields, key => opt[key] === undefined)) &&
      (required === 'date' ||
        arrayEvery(timeFields, key => opt[key] === undefined))
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
    // Step 32.g–h selects the format with the requested matcher.
    if (isTimeRelated(opt)) {
      opt.hour12 = uses12HourCycle
    }
    bestFormat = matchComponents(opt, formats, dataLocaleData, formatMatcher)
  } else {
    // ECMA-402 §11.1.2 step 31.a–c checks for conflicting fields or styles.
    for (let index = 0; index < DATE_TIME_PROPS.length; index++) {
      const prop = DATE_TIME_PROPS[index]
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
    // Step 31.d–e selects a style format. Pass the resolved hour cycle
    // through because locale data stores separate 12- and 24-hour patterns.
    bestFormat = DateTimeStyleFormat(
      dateStyle,
      timeStyle,
      dataLocaleData,
      formats,
      timeStyle !== undefined ? uses12HourCycle : undefined
    )
  }
  // ECMA-402 §11.1.2 step 33 stores the chosen format.
  internalSlots.format = bestFormat
  for (const prop in opt) {
    const p = bestFormat[prop as 'era']
    if (p !== undefined) {
      internalSlots[prop as 'year'] = p as 'numeric'
    }
  }
  let pattern
  let rangePatterns
  // Step 34 exposes the hour cycle when the selected format has an hour.
  if (internalSlots.hour !== undefined) {
    internalSlots.hourCycle = resolvedHourCycle

    if (uses12HourCycle) {
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
  // ECMA-402 §11.2.3.1 Table 5 ties period and precision fields to the pattern.
  // https://tc39.es/ecma402/#sec-datetimeformat-format-record
  if (
    opt.dayPeriod !== undefined &&
    temporalFormatApply(timePatternIndexOf, pattern, ['{dayPeriod}']) >= 0
  ) {
    internalSlots.dayPeriod = opt.dayPeriod
  }
  if (
    opt.fractionalSecondDigits !== undefined &&
    temporalFormatApply(timePatternIndexOf, pattern, [
      '{fractionalSecondDigits}',
    ]) >= 0
  ) {
    internalSlots.fractionalSecondDigits = opt.fractionalSecondDigits
  }
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
      selectedOptions.hour12 = uses12HourCycle
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
      selectedOptions.hour12 = uses12HourCycle
      selected = matchComponents(
        selectedOptions,
        formats,
        dataLocaleData,
        formatMatcher
      )
    }
    const slots = {...internalSlots}
    for (let index = 0; index < DATE_TIME_PROPS.length; index++) {
      const key = DATE_TIME_PROPS[index]
      setDataProperty(slots, key, selected[key])
    }
    slots.hourCycle = resolvedHourCycle
    const use12 = selected.hour !== undefined && uses12HourCycle
    slots.pattern = applyExplicitTimePatternOptions(
      use12 ? selected.pattern12 : selected.pattern,
      selectedOptions,
      slots.locale,
      slots.numberingSystem
    )
    if (
      selectedOptions.dayPeriod !== undefined &&
      temporalFormatApply(timePatternIndexOf, slots.pattern, ['{dayPeriod}']) >=
        0
    ) {
      slots.dayPeriod = selectedOptions.dayPeriod
    }
    if (
      selectedOptions.fractionalSecondDigits !== undefined &&
      temporalFormatApply(timePatternIndexOf, slots.pattern, [
        '{fractionalSecondDigits}',
      ]) >= 0
    ) {
      slots.fractionalSecondDigits = selectedOptions.fractionalSecondDigits
    }
    slots.format = selected
    slots.rangePatterns = matchRangeWidths(
      use12 ? selected.rangePatterns12 : selected.rangePatterns,
      slots,
      selectedOptions
    )
    temporalFormatApply(temporalFormatMapSet, temporalFormats, [kind, slots])
    return slots
  }
  return dtf as Intl.DateTimeFormat // TODO: remove this when https://github.com/microsoft/TypeScript/pull/50402 is merged
}
