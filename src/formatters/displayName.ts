import {IntlConfig, Formatters, IntlFormatters} from '../types'
import {filterProps} from '../utils'
import {
  DisplayNamesOptions,
  DisplayNames as IntlDisplayNames,
} from '@formatjs/intl-displaynames'
import {FormatError, ErrorCode} from 'intl-messageformat'
import {ReactIntlErrorCode, ReactIntlError} from '../error'

const DISPLAY_NAMES_OPTONS: Array<keyof DisplayNamesOptions> = [
  'localeMatcher',
  'style',
  'type',
  'fallback',
]

export function formatDisplayName(
  {locale, onError}: Pick<IntlConfig, 'locale' | 'onError'>,
  getDisplayNames: Formatters['getDisplayNames'],
  value: Parameters<IntlFormatters['formatDisplayName']>[0],
  options: Parameters<IntlFormatters['formatDisplayName']>[1] = {}
): string | undefined {
  const DisplayNames: typeof IntlDisplayNames = (Intl as any).DisplayNames
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
  const filteredOptions = filterProps(options, DISPLAY_NAMES_OPTONS)
  try {
    return getDisplayNames(locale, filteredOptions).of(value)
  } catch (e) {
    onError(
      new ReactIntlError(
        ReactIntlErrorCode.FORMAT_ERROR,
        'Error formatting display name.',
        e
      )
    )
  }
}
