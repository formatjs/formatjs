import {IntlFormatError} from '#packages/intl/error.js'
import type {
  CustomFormats,
  FormatDurationOptions,
  Formatters,
  IntlFormatters,
  OnErrorFn,
} from '#packages/intl/types.js'
import {filterProps, getNamedFormat} from '#packages/intl/utils.js'
import {ErrorCode, FormatError} from 'intl-messageformat'

const DURATION_FORMAT_OPTIONS: Array<
  Exclude<keyof FormatDurationOptions, 'format'>
> = [
  'style',
  'numberingSystem',
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

type Config = {
  locale: string
  formats: CustomFormats
  onError: OnErrorFn
}

function getFormatter(
  {locale, formats, onError}: Config,
  getDurationFormat: Formatters['getDurationFormat'],
  options: FormatDurationOptions
): ReturnType<Formatters['getDurationFormat']> | undefined {
  if (!Intl.DurationFormat) {
    onError(
      new FormatError(
        'Intl.DurationFormat is not available in this environment.\nTry polyfilling it using "@formatjs/intl-durationformat"',
        ErrorCode.MISSING_INTL_API
      )
    )
    return
  }

  const {format} = options
  const defaults = ((format &&
    getNamedFormat(formats, 'duration', format, onError)) ||
    {}) as FormatDurationOptions
  return getDurationFormat(
    locale,
    filterProps(options, DURATION_FORMAT_OPTIONS, defaults)
  )
}

export function formatDuration(
  config: Config,
  getDurationFormat: Formatters['getDurationFormat'],
  value: Parameters<IntlFormatters['formatDuration']>[0],
  options: FormatDurationOptions = {}
): string {
  try {
    return getFormatter(config, getDurationFormat, options)?.format(value) ?? ''
  } catch (e) {
    config.onError(
      new IntlFormatError('Error formatting duration.', config.locale, e)
    )
  }
  return ''
}

export function formatDurationToParts(
  config: Config,
  getDurationFormat: Formatters['getDurationFormat'],
  value: Parameters<IntlFormatters['formatDuration']>[0],
  options: FormatDurationOptions = {}
): ReturnType<IntlFormatters['formatDurationToParts']> {
  try {
    return (
      getFormatter(config, getDurationFormat, options)?.formatToParts(value) ??
      []
    )
  } catch (e) {
    config.onError(
      new IntlFormatError('Error formatting duration.', config.locale, e)
    )
  }
  return []
}
