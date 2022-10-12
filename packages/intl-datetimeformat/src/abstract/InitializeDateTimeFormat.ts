import {
  Formats,
  IntlDateTimeFormatInternal,
  DateTimeFormatLocaleInternalData,
  CanonicalizeLocaleList,
  invariant,
  GetOption,
  IsValidTimeZoneName,
  CanonicalizeTimeZoneName,
  GetNumberOption,
  DateTimeFormat as DateTimeFormat,
} from '@formatjs/ecma402-abstract'
import {BasicFormatMatcher} from './BasicFormatMatcher'
import {BestFitFormatMatcher} from './BestFitFormatMatcher'
import {DATE_TIME_PROPS} from './utils'
import {DateTimeStyleFormat} from './DateTimeStyleFormat'
import {ToDateTimeOptions} from './ToDateTimeOptions'
import {ResolveLocale} from '@formatjs/intl-localematcher'

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

function resolveHourCycle(hc: string, hcDefault: string, hour12?: boolean) {
  if (hc == null) {
    hc = hcDefault
  }
  if (hour12 !== undefined) {
    if (hour12) {
      if (hcDefault === 'h11' || hcDefault === 'h23') {
        hc = 'h11'
      } else {
        hc = 'h12'
      }
    } else {
      invariant(!hour12, 'hour12 must not be set')
      if (hcDefault === 'h11' || hcDefault === 'h23') {
        hc = 'h23'
      } else {
        hc = 'h24'
      }
    }
  }
  return hc
}

interface Opt extends Omit<Formats, 'pattern' | 'pattern12'> {
  localeMatcher: Intl.DateTimeFormatOptions['localeMatcher']
  ca: Intl.DateTimeFormatOptions['calendar']
  nu: Intl.DateTimeFormatOptions['numberingSystem']
  hc: Intl.DateTimeFormatOptions['hourCycle']
}
const TYPE_REGEX = /^[a-z0-9]{3,8}$/i
/**
 * https://tc39.es/ecma402/#sec-initializedatetimeformat
 * @param dtf DateTimeFormat
 * @param locales locales
 * @param opts options
 */
export function InitializeDateTimeFormat(
  dtf: DateTimeFormat,
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
    getInternalSlots(dtf: DateTimeFormat): IntlDateTimeFormatInternal
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
  const options = ToDateTimeOptions(opts, 'any', 'date')
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
  if (calendar !== undefined && !TYPE_REGEX.test(calendar)) {
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
  if (numberingSystem !== undefined && !TYPE_REGEX.test(numberingSystem)) {
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
    if (!IsValidTimeZoneName(timeZone, {tzData, uppercaseLinks})) {
      throw new RangeError('Invalid timeZoneName')
    }
    timeZone = CanonicalizeTimeZoneName(timeZone, {tzData, uppercaseLinks})
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
  opt.fractionalSecondDigits = GetNumberOption(
    options,
    'fractionalSecondDigits',
    1,
    3,
    // @ts-expect-error
    undefined
  ) as 1

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

  let bestFormat
  if (dateStyle === undefined && timeStyle === undefined) {
    if (formatMatcher === 'basic') {
      bestFormat = BasicFormatMatcher(opt, formats)
    } else {
      // IMPL DETAILS START
      if (isTimeRelated(opt)) {
        const hc = resolveHourCycle(
          internalSlots.hourCycle,
          dataLocaleData.hourCycle,
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
    bestFormat = DateTimeStyleFormat(dateStyle, timeStyle, dataLocaleData)
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
  let pattern
  let rangePatterns
  if (internalSlots.hour !== undefined) {
    const hc = resolveHourCycle(
      internalSlots.hourCycle,
      dataLocaleData.hourCycle,
      hour12
    )
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
  internalSlots.pattern = pattern
  internalSlots.rangePatterns = rangePatterns
  return dtf as Intl.DateTimeFormat // TODO: remove this when https://github.com/microsoft/TypeScript/pull/50402 is merged
}
