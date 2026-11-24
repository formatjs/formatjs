import {FilterLocales} from '@formatjs/intl-localematcher'
import {CoerceOptionsToObject} from '#packages/ecma402-abstract/CoerceOptionsToObject.js'
import {GetOption} from '#packages/ecma402-abstract/GetOption.js'

// ECMA-402 §9.2.9 steps 1–2 coerce options and default to best fit.
// https://tc39.es/ecma402/#sec-filterlocales
export function SupportedLocales(
  availableLocales: Set<string>,
  requestedLocales: string[],
  options?: {localeMatcher?: 'best fit' | 'lookup'}
): string[] {
  const matcher = GetOption(
    CoerceOptionsToObject(options),
    'localeMatcher',
    'string',
    ['lookup', 'best fit'],
    'best fit' as const
  )
  return FilterLocales(availableLocales, requestedLocales, matcher, true)
}
