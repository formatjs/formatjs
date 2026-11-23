import {arrayIndexOf, arraySome} from '#packages/ecma262-abstract/intrinsics.js'
import {supportedEntries} from '#packages/intl-supportedvaluesof/supported-entries.js'
import {
  getDateTimeFormatProbe,
  getNumberFormatProbe,
  getRelativeTimeFormatProbe,
} from '#packages/intl-supportedvaluesof/memoize.js'
import {
  numberingSystemCandidateLocales,
  numberingSystemNames,
  numericNumberingSystemNames,
} from '@formatjs_generated/cldr.number/numbering-systems.js'

// ECMA-402 §6.7.1 AvailableCanonicalNumberingSystems.
// https://tc39.es/ecma402/#sec-numberingsystem-identifiers
// https://tc39.es/ecma402/#sec-availablecanonicalnumberingsystems
export function getSupportedNumberingSystems(): string[] {
  const number = getNumberFormatProbe()
  const date = getDateTimeFormatProbe()
  const relative = getRelativeTimeFormatProbe()
  return supportedEntries(numberingSystemNames, system => {
    // Table 30 is mandatory. Additional systems need all three formatters.
    if (arrayIndexOf(numericNumberingSystemNames, system) >= 0) return true
    return arraySome(numberingSystemCandidateLocales[system], candidate => {
      const locale = `${candidate}-u-nu-${system}`
      try {
        return (
          number?.resolve?.(number.create(locale)).numberingSystem === system &&
          date?.resolve?.(date.create(locale)).numberingSystem === system &&
          relative?.resolve?.(relative.create(locale)).numberingSystem ===
            system
        )
      } catch {
        return false
      }
    })
  })
}
