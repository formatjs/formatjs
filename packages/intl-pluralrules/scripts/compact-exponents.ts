import type {CompactExponentData} from '#packages/ecma402-abstract/types/plural-rules.js'

// LDML Compact Number Formats, steps 3 and 5–6 derive the scale from
// the threshold and zero digits; the literal pattern "0" disables scaling.
// https://unicode.org/reports/tr35/tr35-numbers.html#Compact_Number_Formats
// https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35-numbers.md#L442-L458
export async function loadCompactExponents(
  locale: string
): Promise<CompactExponentData> {
  const {default: raw} = await import(
    `cldr-numbers-full/main/${locale}/numbers.json`,
    {with: {type: 'json'}}
  )
  const numbers = raw.main[locale].numbers
  const formats =
    numbers[`decimalFormats-numberSystem-${numbers.defaultNumberingSystem}`]
  const result: CompactExponentData = {short: {}, long: {}}
  for (const style of ['short', 'long'] as const) {
    for (const [key, pattern] of Object.entries(
      formats[style].decimalFormat
    ) as [string, string][]) {
      if (!key.endsWith('-count-other')) continue
      const threshold = key.slice(0, -'-count-other'.length)
      const zeroes = pattern.match(/0+/)
      if (!zeroes) throw new Error(`Missing compact digits: ${locale} ${key}`)
      result[style][threshold.length - 1] =
        pattern === '0' ? 0 : threshold.length - zeroes[0].length
    }
  }
  return result
}
