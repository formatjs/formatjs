import {Formats, invariant} from '@formatjs/ecma402-abstract'
import {
  DATE_TIME_PROPS,
  additionPenalty,
  removalPenalty,
  longMorePenalty,
  shortMorePenalty,
  shortLessPenalty,
  longLessPenalty,
} from './utils'

/**
 * https://tc39.es/ecma402/#sec-basicformatmatcher
 * @param options
 * @param formats
 */
export function BasicFormatMatcher(
  options: Intl.DateTimeFormatOptions,
  formats: Formats[]
): Formats {
  let bestScore = -Infinity
  let bestFormat = formats[0]
  invariant(Array.isArray(formats), 'formats should be a list of things')
  for (const format of formats) {
    let score = 0
    for (const prop of DATE_TIME_PROPS) {
      const optionsProp = options[prop]
      const formatProp = format[prop]
      if (optionsProp === undefined && formatProp !== undefined) {
        score -= additionPenalty
      } else if (optionsProp !== undefined && formatProp === undefined) {
        score -= removalPenalty
      } else if (optionsProp !== formatProp) {
        let values: any[]
        if (prop === 'fractionalSecondDigits') {
          values = [1, 2, 3]
        } else {
          values = ['2-digit', 'numeric', 'narrow', 'short', 'long']
        }
        const optionsPropIndex = values.indexOf(optionsProp as string)
        const formatPropIndex = values.indexOf(formatProp as string)
        const delta = Math.max(
          -2,
          Math.min(formatPropIndex - optionsPropIndex, 2)
        )
        if (delta === 2) {
          score -= longMorePenalty
        } else if (delta === 1) {
          score -= shortMorePenalty
        } else if (delta === -1) {
          score -= shortLessPenalty
        } else if (delta === -2) {
          score -= longLessPenalty
        }
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestFormat = format
    }
  }
  return {...bestFormat}
}
