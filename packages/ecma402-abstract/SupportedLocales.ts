import {LookupSupportedLocales} from '@formatjs/intl-localematcher'
import {ToObject} from './262.js'
import {GetOption} from './GetOption.js'

/**
 * https://tc39.es/ecma402/#sec-supportedlocales
 * @param availableLocales
 * @param requestedLocales
 * @param options
 */
export function SupportedLocales(
  availableLocales: Set<string>,
  requestedLocales: string[],
  options?: {localeMatcher?: 'best fit' | 'lookup'}
): string[] {
  let matcher: 'best fit' | 'lookup' = 'best fit'
  if (options !== undefined) {
    options = ToObject(options)
    matcher = GetOption(
      options,
      'localeMatcher',
      'string',
      ['lookup', 'best fit'],
      'best fit'
    ) as 'best fit'
  }
  if (matcher === 'best fit') {
    return LookupSupportedLocales(
      Array.from(availableLocales),
      requestedLocales
    )
  }
  return LookupSupportedLocales(Array.from(availableLocales), requestedLocales)
}
