import {
  arrayIndexOf,
  mathMin,
  mathMax,
} from '#packages/ecma262-abstract/intrinsics.js'
import {type Formats} from '#packages/ecma402-abstract/types/date-time.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'
import {
  DATE_TIME_PROPS,
  additionPenalty,
  removalPenalty,
  longMorePenalty,
  shortMorePenalty,
  shortLessPenalty,
  longLessPenalty,
  offsetPenalty,
} from '#packages/ecma402-abstract/DateTimeFormat/utils.js'

const formatListIsArray = Array.isArray

/**
 * https://tc39.es/ecma402/#sec-basicformatmatcher
 * @param options
 * @param formats
 */
export function BasicFormatMatcher(
  options: Intl.DateTimeFormatOptions,
  formats: Formats[]
): Formats {
  // ECMA-402 §11.5.2: score private format/field Lists with captured intrinsics.
  // https://tc39.es/ecma402/#sec-basicformatmatcher
  let bestScore = -Infinity
  let bestFormat = formats[0]
  invariant(formatListIsArray(formats), 'formats should be a list of things')
  for (let formatIndex = 0; formatIndex < formats.length; formatIndex++) {
    const format = formats[formatIndex]
    let score = 0
    for (let propIndex = 0; propIndex < DATE_TIME_PROPS.length; propIndex++) {
      const prop = DATE_TIME_PROPS[propIndex]
      const optionsProp = options[prop]
      const formatProp = format[prop]
      if (optionsProp === undefined && formatProp !== undefined) {
        score -= additionPenalty
      } else if (optionsProp !== undefined && formatProp === undefined) {
        score -= removalPenalty
      } else if (prop === 'timeZoneName') {
        if (optionsProp === 'short' || optionsProp === 'shortGeneric') {
          if (formatProp === 'shortOffset') {
            score -= offsetPenalty
          } else if (formatProp === 'longOffset') {
            score -= offsetPenalty + shortMorePenalty
          } else if (optionsProp === 'short' && formatProp === 'long') {
            score -= shortMorePenalty
          } else if (
            optionsProp === 'shortGeneric' &&
            formatProp === 'longGeneric'
          ) {
            score -= shortMorePenalty
          } else if (optionsProp !== formatProp) {
            score -= removalPenalty
          }
        } else if (
          optionsProp === 'shortOffset' &&
          formatProp === 'longOffset'
        ) {
          score -= shortMorePenalty
        } else if (optionsProp === 'long' || optionsProp === 'longGeneric') {
          if (formatProp === 'longOffset') {
            score -= offsetPenalty
          } else if (formatProp === 'shortOffset') {
            score -= offsetPenalty + longLessPenalty
          } else if (optionsProp === 'long' && formatProp === 'short') {
            score -= longLessPenalty
          } else if (
            optionsProp === 'longGeneric' &&
            formatProp === 'shortGeneric'
          ) {
            score -= longLessPenalty
          } else if (optionsProp !== formatProp) {
            score -= removalPenalty
          }
        } else if (
          optionsProp === 'longOffset' &&
          formatProp === 'shortOffset'
        ) {
          score -= longLessPenalty
        } else if (optionsProp !== formatProp) {
          score -= removalPenalty
        }
      } else if (optionsProp !== formatProp) {
        let values: any[]
        if (prop === 'fractionalSecondDigits') {
          values = [1, 2, 3]
        } else {
          values = ['2-digit', 'numeric', 'narrow', 'short', 'long']
        }
        const optionsPropIndex = arrayIndexOf(values, optionsProp as string)
        const formatPropIndex = arrayIndexOf(values, formatProp as string)
        const delta = mathMax(
          -2,
          mathMin(formatPropIndex - optionsPropIndex, 2)
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
