import {Formatters, IntlFormatters, OnErrorFn} from './types'
import {filterProps} from './utils'

import {ErrorCode, FormatError} from 'intl-messageformat'
import {IntlFormatError} from './error'

const DISPLAY_NAMES_OPTONS: Array<keyof Intl.DisplayNamesOptions> = [
  'style',
  'type',
  'fallback',
  'languageDisplay',
]

export function formatDisplayName(
  {
    locale,
    onError,
  }: {
    locale: string
    onError: OnErrorFn
  },
  getDisplayNames: Formatters['getDisplayNames'],
  value: Parameters<IntlFormatters['formatDisplayName']>[0],
  options: Parameters<IntlFormatters['formatDisplayName']>[1]
): string | undefined {
  const DisplayNames: typeof Intl.DisplayNames = (Intl as any).DisplayNames
  if (!DisplayNames) {
    onError(
      new FormatError(
        `Intl.DisplayNames is not available in this environment.
Try polyfilling it using "@formatjs/intl-displaynames"
`,
        ErrorCode.MISSING_INTL_API
      )
    )
  }
  const filteredOptions = filterProps(
    options,
    DISPLAY_NAMES_OPTONS
  ) as Intl.DisplayNamesOptions
  try {
    return getDisplayNames(locale, filteredOptions).of(value)
  } catch (e) {
    onError(new IntlFormatError('Error formatting display name.', locale, e))
  }
}
