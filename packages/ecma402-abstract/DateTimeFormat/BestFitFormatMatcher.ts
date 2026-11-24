import {
  arrayIndexOf,
  mathMin,
  mathMax,
} from '#packages/ecma262-abstract/intrinsics.js'
import {
  type Formats,
  type TABLE_6,
} from '#packages/ecma402-abstract/types/date-time.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'
import {
  availableFormatHourCycle,
  getDateTimePatternFields,
} from '#packages/ecma402-abstract/DateTimeFormat/skeleton.js'
import {
  DATE_TIME_PROPS,
  additionPenalty,
  differentNumericTypePenalty,
  longLessPenalty,
  longMorePenalty,
  removalPenalty,
  shortLessPenalty,
  shortMorePenalty,
} from '#packages/ecma402-abstract/DateTimeFormat/utils.js'

function isNumericType(
  t: 'numeric' | '2-digit' | 'narrow' | 'short' | 'long'
): boolean {
  return t === 'numeric' || t === '2-digit'
}

const formatListIsArray = Array.isArray
const formatRecordKeys = Object.keys

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
  // ECMA-402 §11.5.3 matches requested components (no numbered steps).
  // An hour-cycle preference must not add an unrequested hour field.
  // https://tc39.es/ecma402/#sec-bestfitformatmatcher
  if (options.hour !== undefined) {
    if (options.hour12 && !format.hour12) {
      score -= removalPenalty
    } else if (!options.hour12 && format.hour12) {
      score -= additionPenalty
    }
  }
  for (let propIndex = 0; propIndex < DATE_TIME_PROPS.length; propIndex++) {
    const prop = DATE_TIME_PROPS[propIndex]
    const optionsProp = options[prop as TABLE_6]
    // LDML matching skeletons allow adding precision to a seconds pattern.
    // https://unicode.org/reports/tr35/tr35-dates.html#Matching_Skeletons
    const formatProp =
      prop === 'fractionalSecondDigits' && format.second !== undefined
        ? (format.fractionalSecondDigits ?? optionsProp)
        : format[prop as TABLE_6]
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
  }
  return score
}

/**
 * https://tc39.es/ecma402/#sec-bestfitformatmatcher
 * @param options
 * @param formats
 * @param supplementalFormat
 */
export function BestFitFormatMatcher(
  options: Intl.DateTimeFormatOptions,
  formats: Formats[],
  supplementalFormat?: Formats
): Formats {
  // ECMA-402 §11.5.3: preserve the implementation-defined matching score/adjustment.
  // https://tc39.es/ecma402/#sec-bestfitformatmatcher
  let bestScore = -Infinity
  let bestFormat = formats[0]
  invariant(formatListIsArray(formats), 'formats should be a list of things')
  const hour12 = availableFormatHourCycle(options, formats)
  const count = formats.length + (supplementalFormat ? 1 : 0)
  for (let formatIndex = 0; formatIndex < count; formatIndex++) {
    const format =
      formatIndex < formats.length ? formats[formatIndex] : supplementalFormat!
    if (hour12 !== undefined) {
      const fields = getDateTimePatternFields(format)
      if (fields.hour !== undefined && (fields.hour12 === true) !== hour12) {
        continue
      }
    }
    const score = bestFitFormatMatcherScore(options, format)
    if (
      score > bestScore ||
      (score === bestScore &&
        options.month !== undefined &&
        format.month === options.month &&
        bestFormat.month !== options.month)
    ) {
      bestScore = score
      bestFormat = format
    }
  }

  const skeletonFormat = {...bestFormat}
  // ECMA-402 §11.5.3 returns an internal Record (no numbered steps).
  // Reuse registered pattern fields so matching preserves RegExp statics.
  // https://tc39.es/ecma402/#sec-bestfitformatmatcher
  const patternFormat = {
    __proto__: null,
    rawPattern: bestFormat.rawPattern,
    ...getDateTimePatternFields(bestFormat),
  } as Partial<Formats>

  // Kinda following https://github.com/unicode-org/icu/blob/dd50e38f459d84e9bf1b0c618be8483d318458ad/icu4j/main/classes/core/src/com/ibm/icu/text/DateTimePatternGenerator.java
  // Method adjustFieldTypes
  const props = formatRecordKeys(skeletonFormat)
  for (let propIndex = 0; propIndex < props.length; propIndex++) {
    const prop = props[propIndex]
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
    // Some calendars use month names even for numeric skeletons. Changing
    // numeric to 2-digit must preserve that locale-specific representation.
    if (
      prop === 'month' &&
      isNumericType(skeletonValue as 'numeric') &&
      isNumericType(requestedValue as 'numeric') &&
      !isNumericType(patternValue as 'short')
    ) {
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
  return patternFormat as Formats
}
