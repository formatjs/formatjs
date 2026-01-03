import {type NumberFormatOptions} from '@formatjs/ecma402-abstract'
import {IntlFormatError} from './error.js'
import {
  type CustomFormats,
  type Formatters,
  type IntlFormatters,
  type OnErrorFn,
} from './types.js'
import {filterProps, getNamedFormat} from './utils.js'

const NUMBER_FORMAT_OPTIONS: Array<keyof NumberFormatOptions> = [
  'style',
  'currency',
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

  // ES2023 NumberFormat
  'trailingZeroDisplay',
  'roundingPriority',
  'roundingIncrement',
  'roundingMode',
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
      new IntlFormatError('Error formatting number.', config.locale, e)
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
      new IntlFormatError('Error formatting number.', config.locale, e)
    )
  }

  return []
}
