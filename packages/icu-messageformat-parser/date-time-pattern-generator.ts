import {timeData} from './time-data.generated.js'

/**
 * Returns the best matching date time pattern if a date time skeleton
 * pattern is provided with a locale. Follows the Unicode specification:
 * https://www.unicode.org/reports/tr35/tr35-dates.html#table-mapping-requested-time-skeletons-to-patterns
 * @param skeleton date time skeleton pattern that possibly includes j, J or C
 * @param locale
 */
export function getBestPattern(skeleton: string, locale: Intl.Locale): string {
  let skeletonCopy = ''
  for (let patternPos = 0; patternPos < skeleton.length; patternPos++) {
    const patternChar = skeleton.charAt(patternPos)

    if (patternChar === 'j') {
      let extraLength = 0
      while (
        patternPos + 1 < skeleton.length &&
        skeleton.charAt(patternPos + 1) === patternChar
      ) {
        extraLength++
        patternPos++
      }

      let hourLen = 1 + (extraLength & 1)
      let dayPeriodLen = extraLength < 2 ? 1 : 3 + (extraLength >> 1)
      let dayPeriodChar = 'a'
      let hourChar = getDefaultHourSymbolFromLocale(locale)

      if (hourChar == 'H' || hourChar == 'k') {
        dayPeriodLen = 0
      }

      while (dayPeriodLen-- > 0) {
        skeletonCopy += dayPeriodChar
      }
      while (hourLen-- > 0) {
        skeletonCopy = hourChar + skeletonCopy
      }
    } else if (patternChar === 'J') {
      skeletonCopy += 'H'
    } else {
      skeletonCopy += patternChar
    }
  }

  return skeletonCopy
}

/**
 * Maps the [hour cycle type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/hourCycle)
 * of the given `locale` to the corresponding time pattern.
 * @param locale
 */
function getDefaultHourSymbolFromLocale(locale: Intl.Locale): string {
  let hourCycle = locale.hourCycle

  if (
    hourCycle === undefined &&
    // @ts-ignore hourCycle(s) is not identified yet
    locale.hourCycles &&
    // @ts-ignore
    locale.hourCycles.length
  ) {
    // @ts-ignore
    hourCycle = locale.hourCycles[0]
  }

  if (hourCycle) {
    switch (hourCycle) {
      case 'h24':
        return 'k'
      case 'h23':
        return 'H'
      case 'h12':
        return 'h'
      case 'h11':
        return 'K'
      default:
        throw new Error('Invalid hourCycle')
    }
  }

  // TODO: Once hourCycle is fully supported remove the following with data generation
  const languageTag = locale.language
  let regionTag: string | undefined
  if (languageTag !== 'root') {
    regionTag = locale.maximize().region
  }
  const hourCycles =
    timeData[regionTag || ''] ||
    timeData[languageTag || ''] ||
    timeData[`${languageTag}-001`] ||
    timeData['001']
  return hourCycles[0]
}
