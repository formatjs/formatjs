import {Formats, TABLE_6, invariant} from '@formatjs/ecma402-abstract'
import {
  DATE_TIME_PROPS,
  removalPenalty,
  additionPenalty,
  differentNumericTypePenalty,
  longMorePenalty,
  shortMorePenalty,
  shortLessPenalty,
  longLessPenalty,
} from './utils'
import {processDateTimePattern} from './skeleton'

function isNumericType(
  t: 'numeric' | '2-digit' | 'narrow' | 'short' | 'long'
): boolean {
  return t === 'numeric' || t === '2-digit'
}

/**
 * Credit: https://github.com/andyearnshaw/Intl.js/blob/0958dc1ad8153f1056653ea22b8208f0df289a4e/src/12.datetimeformat.js#L611
 * with some modifications
 * @param options
 * @param format
 */
export function bestFitFormatMatcherScore(
  options: Intl.DateTimeFormatOptions,
  format: Formats
): number {
  let score = 0
  if (options.hour12 && !format.hour12) {
    score -= removalPenalty
  } else if (!options.hour12 && format.hour12) {
    score -= additionPenalty
  }
  for (const prop of DATE_TIME_PROPS) {
    const optionsProp = options[prop as TABLE_6]
    const formatProp = format[prop as TABLE_6]
    if (optionsProp === undefined && formatProp !== undefined) {
      score -= additionPenalty
    } else if (optionsProp !== undefined && formatProp === undefined) {
      score -= removalPenalty
    } else if (optionsProp !== formatProp) {
      // extra penalty for numeric vs non-numeric
      if (
        isNumericType(optionsProp as 'numeric') !==
        isNumericType(formatProp as 'short')
      ) {
        score -= differentNumericTypePenalty
      } else {
        const values = ['2-digit', 'numeric', 'narrow', 'short', 'long']
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
  }
  return score
}

/**
 * https://tc39.es/ecma402/#sec-bestfitformatmatcher
 * Just alias to basic for now
 * @param options
 * @param formats
 * @param implDetails Implementation details
 */
export function BestFitFormatMatcher(
  options: Intl.DateTimeFormatOptions,
  formats: Formats[]
) {
  let bestScore = -Infinity
  let bestFormat = formats[0]
  invariant(Array.isArray(formats), 'formats should be a list of things')
  for (const format of formats) {
    const score = bestFitFormatMatcherScore(options, format)
    if (score > bestScore) {
      bestScore = score
      bestFormat = format
    }
  }

  const skeletonFormat = {...bestFormat}
  const patternFormat = {rawPattern: bestFormat.rawPattern} as Formats
  processDateTimePattern(bestFormat.rawPattern, patternFormat)

  // Kinda following https://github.com/unicode-org/icu/blob/dd50e38f459d84e9bf1b0c618be8483d318458ad/icu4j/main/classes/core/src/com/ibm/icu/text/DateTimePatternGenerator.java
  // Method adjustFieldTypes
  for (const prop in skeletonFormat) {
    const skeletonValue = skeletonFormat[prop as TABLE_6]
    const patternValue = patternFormat[prop as TABLE_6]
    const requestedValue = options[prop as TABLE_6]
    // Don't mess with minute/second or we can get in the situation of
    // 7:0:0 which is weird
    if (prop === 'minute' || prop === 'second') {
      continue
    }
    // Nothing to do here
    if (!requestedValue) {
      continue
    }
    // https://unicode.org/reports/tr35/tr35-dates.html#Matching_Skeletons
    // Looks like we should not convert numeric to alphabetic but the other way
    // around is ok
    if (
      isNumericType(patternValue as 'numeric') &&
      !isNumericType(requestedValue as 'short')
    ) {
      continue
    }

    if (skeletonValue === requestedValue) {
      continue
    }
    patternFormat[prop as TABLE_6] = requestedValue as any
  }
  // Copy those over
  patternFormat.pattern = skeletonFormat.pattern
  patternFormat.pattern12 = skeletonFormat.pattern12
  patternFormat.skeleton = skeletonFormat.skeleton
  patternFormat.rangePatterns = skeletonFormat.rangePatterns
  patternFormat.rangePatterns12 = skeletonFormat.rangePatterns12
  return patternFormat
}
