import {Formatters, IntlFormatters, CustomFormats, OnErrorFn} from './types'
import {getNamedFormat, filterProps} from './utils'
import {IntlError, IntlErrorCode} from './error'
import {NumberFormatOptions} from '@formatjs/ecma402-abstract'

const NUMBER_FORMAT_OPTIONS: Array<keyof NumberFormatOptions> = [
  'style',
  'currency',
  'currencyDisplay',
  'unit',
  'unitDisplay',
  'useGrouping',

  'minimumIntegerDigits',
  'minimumFractionDigits',
  'maximumFractionDigits',
  'minimumSignificantDigits',
  'maximumSignificantDigits',

  // ES2020 NumberFormat
  'compactDisplay',
  'currencyDisplay',
  'currencySign',
  'notation',
  'signDisplay',
  'unit',
  'unitDisplay',
  'numberingSystem',
]

export function getFormatter(
  {
    locale,
    formats,
    onError,
  }: {
    locale: string

    formats: CustomFormats
    onError: OnErrorFn
  },
  getNumberFormat: Formatters['getNumberFormat'],
  options: Parameters<IntlFormatters['formatNumber']>[1] = {}
): Intl.NumberFormat {
  const {format} = options
  const defaults = ((format &&
    getNamedFormat(formats!, 'number', format, onError)) ||
    {}) as NumberFormatOptions
  const filteredOptions = filterProps(
    options,
    NUMBER_FORMAT_OPTIONS,
    defaults
  ) as NumberFormatOptions

  return getNumberFormat(locale, filteredOptions)
}

export function formatNumber(
  config: {
    locale: string

    formats: CustomFormats
    onError: OnErrorFn
  },
  getNumberFormat: Formatters['getNumberFormat'],
  value: Parameters<IntlFormatters['formatNumber']>[0],
  options: Parameters<IntlFormatters['formatNumber']>[1] = {}
): string {
  try {
    return getFormatter(config, getNumberFormat, options).format(value)
  } catch (e) {
    config.onError(
      new IntlError(IntlErrorCode.FORMAT_ERROR, 'Error formatting number.', e)
    )
  }

  return String(value)
}

export function formatNumberToParts(
  config: {
    locale: string
    formats: CustomFormats
    onError: OnErrorFn
  },
  getNumberFormat: Formatters['getNumberFormat'],
  value: Parameters<IntlFormatters['formatNumber']>[0],
  options: Parameters<IntlFormatters['formatNumber']>[1] = {}
): Intl.NumberFormatPart[] {
  try {
    return getFormatter(config, getNumberFormat, options).formatToParts(
      value as number
    )
  } catch (e) {
    config.onError(
      new IntlError(IntlErrorCode.FORMAT_ERROR, 'Error formatting number.', e)
    )
  }

  return []
}
