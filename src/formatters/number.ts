import {IntlConfig, Formatters, IntlFormatters} from '../types'
import {getNamedFormat, filterProps} from '../utils'
import {UnifiedNumberFormatOptions} from '@formatjs/intl-unified-numberformat'
import {ReactIntlError, ReactIntlErrorCode} from '../error'

const NUMBER_FORMAT_OPTIONS: Array<keyof UnifiedNumberFormatOptions> = [
  'localeMatcher',

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

  // Unified NumberFormat (Stage 3 as of 10/22/19)
  'compactDisplay',
  'currencyDisplay',
  'currencySign',
  'notation',
  'signDisplay',
  'unit',
  'unitDisplay',
]

export function getFormatter(
  {
    locale,
    formats,
    onError,
  }: Pick<IntlConfig, 'locale' | 'formats' | 'onError'>,
  getNumberFormat: Formatters['getNumberFormat'],
  options: Parameters<IntlFormatters['formatNumber']>[1] = {}
): Intl.NumberFormat {
  const {format} = options
  const defaults = ((format &&
    getNamedFormat(formats!, 'number', format, onError)) ||
    {}) as UnifiedNumberFormatOptions
  const filteredOptions = filterProps(options, NUMBER_FORMAT_OPTIONS, defaults)

  return getNumberFormat(locale, filteredOptions)
}

export function formatNumber(
  config: Pick<IntlConfig, 'locale' | 'formats' | 'onError'>,
  getNumberFormat: Formatters['getNumberFormat'],
  value: Parameters<IntlFormatters['formatNumber']>[0],
  options: Parameters<IntlFormatters['formatNumber']>[1] = {}
): string {
  try {
    return getFormatter(config, getNumberFormat, options).format(value)
  } catch (e) {
    config.onError(
      new ReactIntlError(
        ReactIntlErrorCode.FORMAT_ERROR,
        'Error formatting number.',
        e
      )
    )
  }

  return String(value)
}

export function formatNumberToParts(
  config: Pick<IntlConfig, 'locale' | 'formats' | 'onError'>,
  getNumberFormat: Formatters['getNumberFormat'],
  value: Parameters<IntlFormatters['formatNumber']>[0],
  options: Parameters<IntlFormatters['formatNumber']>[1] = {}
): Intl.NumberFormatPart[] {
  try {
    return getFormatter(config, getNumberFormat, options).formatToParts(value)
  } catch (e) {
    config.onError(
      new ReactIntlError(
        ReactIntlErrorCode.FORMAT_ERROR,
        'Error formatting number.',
        e
      )
    )
  }

  return []
}
