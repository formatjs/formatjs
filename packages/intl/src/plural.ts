import {ErrorCode, FormatError} from 'intl-messageformat'
import {IntlFormatError} from './error'
import {Formatters, IntlFormatters, OnErrorFn} from './types'
import {filterProps} from './utils'

const PLURAL_FORMAT_OPTIONS: Array<keyof Intl.PluralRulesOptions> = ['type']

export function formatPlural(
  {
    locale,
    onError,
  }: {
    locale: string
    onError: OnErrorFn
  },
  getPluralRules: Formatters['getPluralRules'],
  value: Parameters<IntlFormatters['formatPlural']>[0],
  options: Parameters<IntlFormatters['formatPlural']>[1] = {}
): Intl.LDMLPluralRule {
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
  const filteredOptions = filterProps(
    options,
    PLURAL_FORMAT_OPTIONS
  ) as Intl.PluralRulesOptions

  try {
    return getPluralRules(locale, filteredOptions).select(
      value
    ) as Intl.LDMLPluralRule
  } catch (e) {
    onError(new IntlFormatError('Error formatting plural.', locale, e))
  }

  return 'other'
}
