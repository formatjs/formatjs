import {IntlConfig, Formatters, IntlFormatters} from '../types'
import {filterProps} from '../utils'
import {ReactIntlErrorCode, ReactIntlError} from '../error'
import {FormatError, ErrorCode} from 'intl-messageformat'

const PLURAL_FORMAT_OPTIONS: Array<keyof Intl.PluralRulesOptions> = [
  'localeMatcher',
  'type',
]

export function formatPlural(
  {locale, onError}: Pick<IntlConfig, 'locale' | 'onError'>,
  getPluralRules: Formatters['getPluralRules'],
  value: Parameters<IntlFormatters['formatPlural']>[0],
  options: Parameters<IntlFormatters['formatPlural']>[1] = {}
): string {
  if (!Intl.PluralRules) {
    onError(
      new FormatError(
        `Intl.PluralRules is not available in this environment.
Try polyfilling it using "@formatjs/intl-pluralrules"
`,
        ErrorCode.MISSING_INTL_API
      )
    )
  }
  const filteredOptions = filterProps(options, PLURAL_FORMAT_OPTIONS)

  try {
    return getPluralRules(locale, filteredOptions).select(value)
  } catch (e) {
    onError(
      new ReactIntlError(
        ReactIntlErrorCode.FORMAT_ERROR,
        'Error formatting plural.',
        e
      )
    )
  }

  return 'other'
}
