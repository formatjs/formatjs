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
} from '#packages/ecma402-abstract/types/date-time.js'
import {
  invariant,
  createMemoizedNumberFormat,
} from '#packages/ecma402-abstract/utils.js'
import {ResolveLocale} from '@formatjs/intl-localematcher'
import {BasicFormatMatcher} from '#packages/ecma402-abstract/DateTimeFormat/BasicFormatMatcher.js'
import {BestFitFormatMatcher} from '#packages/ecma402-abstract/DateTimeFormat/BestFitFormatMatcher.js'
import {DateTimeStyleFormat} from '#packages/ecma402-abstract/DateTimeFormat/DateTimeStyleFormat.js'
import {CoerceOptionsToObject} from '#packages/ecma402-abstract/CoerceOptionsToObject.js'
import {DATE_TIME_PROPS} from '#packages/ecma402-abstract/DateTimeFormat/utils.js'

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

function applyExplicitTimePatternOptions(
  pattern: string,
  opt: Opt,
  locale: string,
  numberingSystem: string
) {
  if (
    opt.fractionalSecondDigits !== undefined &&
    pattern.includes('{second}') &&
    !pattern.includes('{fractionalSecondDigits}')
  ) {
    // LDML matching skeletons: append the locale's decimal separator before S.
    // https://unicode.org/reports/tr35/tr35-dates.html#Matching_Skeletons
    // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35-dates.md#L834
    const numberOptions = Object.create(null)
    numberOptions.numberingSystem = numberingSystem
    const decimal = createMemoizedNumberFormat(locale, numberOptions)
      .formatToParts(1.1)
      .find(part => part.type === 'decimal')?.value
    invariant(
      decimal !== undefined,
      'Missing decimal separator for fractional seconds'
    )
    pattern = pattern.replace(
      '{second}',
      `{second}${decimal}{fractionalSecondDigits}`
    )
  }
  if (opt.dayPeriod !== undefined) {
    pattern = pattern.replace('{ampm}', '{dayPeriod}')
  }
  return pattern
}

interface Opt extends Omit<Formats, 'pattern' | 'pattern12'> {
  localeMatcher: Intl.DateTimeFormatOptions['localeMatcher']
  ca: Intl.DateTimeFormatOptions['calendar']
  nu: Intl.DateTimeFormatOptions['numberingSystem']
  hc: Intl.DateTimeFormatOptions['hourCycle']
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
  }
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
    throw new RangeError('Malformed calendar')
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
    throw new RangeError('Malformed numbering system')
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
    timeZone = String(timeZone)
    if (
      !IsValidTimeZoneName(timeZone, {
        zoneNamesFromData: Object.keys(tzData),
        uppercaseLinks,
      })
    ) {
      throw new RangeError('Invalid timeZoneName')
    }
    timeZone = CanonicalizeTimeZoneName(timeZone, {
      zoneNames: Object.keys(tzData),
      uppercaseLinks,
    })
  } else {
    timeZone = getDefaultTimeZone()
  }
  internalSlots.timeZone = timeZone

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

  const dataLocaleData = localeData[dataLocale]
  invariant(!!dataLocaleData, `Missing locale data for ${dataLocale}`)
  const formats = dataLocaleData.formats[calendar as string]
  // UNSPECCED: IMPLEMENTATION DETAILS
  if (!formats) {
    throw new RangeError(
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
    const needDefaults = [
      'weekday',
      'year',
      'month',
      'day',
      'dayPeriod',
      'hour',
      'minute',
      'second',
      'fractionalSecondDigits',
    ].every(key => opt[key as keyof Opt] === undefined)
    if (needDefaults) {
      opt.year = 'numeric'
      opt.month = 'numeric'
      opt.day = 'numeric'
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
        throw new TypeError(
          `Intl.DateTimeFormat can't set option ${prop} when ${
            dateStyle ? 'dateStyle' : 'timeStyle'
          } is used`
        )
      }
    }
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
  internalSlots.rangePatterns = rangePatterns
  // Temporal GetDateTimeFormat and AdjustDateTimeStyleFormat use the original
  // component record. Cache variants without rereading the caller's options.
  // https://tc39.es/proposal-temporal/#sec-getdatetimeformat
  // https://tc39.es/proposal-temporal/#sec-adjustdatetimestyleformat
  const temporalFormats = new Map<
    TemporalDateTimeKind,
    IntlDateTimeFormatInternal
  >()
  internalSlots.getTemporalFormat = kind => {
    const cached = temporalFormats.get(kind)
    if (cached) return cached
    const dateFields = ['weekday', 'year', 'month', 'day'] as const
    const timeFields = [
      'dayPeriod',
      'hour',
      'minute',
      'second',
      'fractionalSecondDigits',
    ] as const
    const allFields = [...dateFields, ...timeFields]
    const required =
      kind === 'PlainDate'
        ? [...dateFields]
        : kind === 'PlainYearMonth'
          ? (['year', 'month'] as const)
          : kind === 'PlainMonthDay'
            ? (['month', 'day'] as const)
            : kind === 'PlainTime'
              ? [...timeFields]
              : allFields
    const defaults =
      kind === 'PlainDate'
        ? (['year', 'month', 'day'] as const)
        : kind === 'PlainTime'
          ? (['hour', 'minute', 'second'] as const)
          : kind === 'PlainYearMonth' || kind === 'PlainMonthDay'
            ? required
            : (['year', 'month', 'day', 'hour', 'minute', 'second'] as const)
    const allowed: Array<keyof Opt> = [...required]
    if (kind !== 'PlainTime' && kind !== 'PlainMonthDay') allowed.push('era')
    if (kind === 'Instant') allowed.push('timeZoneName')
    const selectedOptions: Opt = Object.create(null)
    let selected: Formats
    if (dateStyle !== undefined || timeStyle !== undefined) {
      if (
        (kind === 'PlainTime' && timeStyle === undefined) ||
        ((kind === 'PlainDate' ||
          kind === 'PlainYearMonth' ||
          kind === 'PlainMonthDay') &&
          dateStyle === undefined)
      ) {
        throw new TypeError(
          'DateTimeFormat styles do not overlap the Temporal type'
        )
      }
      for (const key of allowed) {
        Object.assign(selectedOptions, {
          [key]: bestFormat[key as keyof Formats],
        })
      }
      const conflicting = DATE_TIME_PROPS.some(
        key => bestFormat[key] !== undefined && !allowed.includes(key)
      )
      selectedOptions.hour12 =
        temporalHourCycle === 'h11' || temporalHourCycle === 'h12'
      selected = !conflicting
        ? bestFormat
        : formatMatcher === 'basic'
          ? BasicFormatMatcher(selectedOptions, formats)
          : BestFitFormatMatcher(selectedOptions, formats)
    } else {
      for (const key of allowed)
        Object.assign(selectedOptions, {[key]: temporalOptions[key]})
      if (required.every(key => temporalOptions[key] === undefined)) {
        if (
          kind !== 'Instant' &&
          allFields.some(key => temporalOptions[key] !== undefined)
        ) {
          throw new TypeError(
            'DateTimeFormat options do not overlap the Temporal type'
          )
        }
        for (const key of defaults)
          Object.assign(selectedOptions, {[key]: 'numeric'})
      }
      selectedOptions.hour12 =
        temporalHourCycle === 'h11' || temporalHourCycle === 'h12'
      selected =
        formatMatcher === 'basic'
          ? BasicFormatMatcher(selectedOptions, formats)
          : BestFitFormatMatcher(selectedOptions, formats)
    }
    const slots = {...internalSlots}
    for (const key of DATE_TIME_PROPS) {
      Object.assign(slots, {[key]: selected[key]})
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
    slots.rangePatterns = use12
      ? selected.rangePatterns12
      : selected.rangePatterns
    slots.format = selected
    if (kind !== 'Instant') slots.timeZone = '+00:00'
    temporalFormats.set(kind, slots)
    return slots
  }
  return dtf as Intl.DateTimeFormat // TODO: remove this when https://github.com/microsoft/TypeScript/pull/50402 is merged
}
