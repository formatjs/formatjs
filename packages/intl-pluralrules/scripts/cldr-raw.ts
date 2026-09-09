import {join} from 'path'
import {outputFileSync} from 'fs-extra/esm'
import serialize from 'serialize-javascript'
import {
  type CompactExponentData,
  type LDMLPluralRule,
} from '#packages/ecma402-abstract/types/plural-rules.js'
import plurals from 'cldr-core/supplemental/plurals.json' with {type: 'json'}
import ordinals from 'cldr-core/supplemental/ordinals.json' with {type: 'json'}
import pluralRanges from 'cldr-core/supplemental/pluralRanges.json' with {type: 'json'}
import minimist from 'minimist'
import {PluralRulesCompiler} from './plural-rules-compiler.ts'

const cardinalsData = plurals.supplemental['plurals-type-cardinal']
const ordinalsData = ordinals.supplemental['plurals-type-ordinal']
const rangesData = pluralRanges.supplemental.plurals

const languages = Object.keys(cardinalsData)

function parsePluralRanges(locale: string) {
  const rangeRules = rangesData[locale]
  if (!rangeRules) {
    return undefined
  }

  const cardinal: Record<string, LDMLPluralRule> = {}
  const ordinal: Record<string, LDMLPluralRule> = {}

  // Parse keys like "pluralRange-start-one-end-other" -> "one_other"
  for (const [key, value] of Object.entries(rangeRules)) {
    const match = key.match(/pluralRange-start-(\w+)-end-(\w+)/)
    if (match) {
      const [, start, end] = match
      const rangeKey = `${start}_${end}`

      // For now, treat all ranges as cardinal
      // TODO: Distinguish between cardinal and ordinal ranges if CLDR provides separate data
      cardinal[rangeKey] = value as LDMLPluralRule
    }
  }

  return Object.keys(cardinal).length > 0 ? {cardinal, ordinal} : undefined
}

/**
 * Internal data structure for generated locale data.
 * This is an implementation detail - not part of ECMA-402 or CLDR specs.
 */
interface LocaleData {
  data: {
    compactExponents?: CompactExponentData
    // CLDR spec: Available plural categories for this locale
    categories: {cardinal: string[]; ordinal: string[]}
    // Implementation: Compiled plural rule function
    // Takes (number string, isOrdinal, exponent) and returns plural category
    fn: Function
    // CLDR spec (LDML-43): Plural ranges for range formatting
    pluralRanges?: {
      cardinal: Record<string, LDMLPluralRule>
      ordinal: Record<string, LDMLPluralRule>
    }
  }
  locale: string
}

// LDML Compact Number Formats, steps 3 and 5–6 derive the scale from
// the threshold and zero digits; the literal pattern "0" disables scaling.
// https://unicode.org/reports/tr35/tr35-numbers.html#Compact_Number_Formats
// https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35-numbers.md#L442-L458
async function loadCompactExponents(
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

async function generateLocaleData(
  locale: string
): Promise<LocaleData | undefined> {
  const cardinalRules = cardinalsData[locale]
  const ordinalRules = ordinalsData[locale]

  // Implementation: Compile CLDR plural rules to optimized JavaScript function
  const compiler = new PluralRulesCompiler(locale, cardinalRules, ordinalRules)
  const compactExponents = compiler.usesCompactExponent()
    ? await loadCompactExponents(locale)
    : undefined
  const fnCode = compiler.compile() // Returns JavaScript function code string

  // Implementation: Convert function code string to actual function using eval
  // This allows serialize-javascript to properly serialize it later
  // eslint-disable-next-line no-eval
  const fn = eval(`(${fnCode})`)

  // CLDR spec (LDML-43): Parse plural ranges if available
  const pluralRanges = parsePluralRanges(locale)

  return {
    data: {
      categories: compiler.categories,
      ...(compactExponents && {compactExponents}),
      fn,
      ...(pluralRanges && {pluralRanges}),
    },
    locale,
  }
}

interface Args extends minimist.ParsedArgs {
  outDir: string
  out: string
}

async function main(args: Args) {
  const {outDir, out} = args

  const locales = languages
    .filter(locale => {
      try {
        ;(Intl as any).getCanonicalLocales(locale)
      } catch {
        console.warn(`Invalid locale ${locale}`)
        return false
      }
      return true
    })
    .sort()

  if (outDir) {
    await Promise.all(
      locales.map(async locale => {
        console.log(join(outDir, `${locale}.js`))
        const data = await generateLocaleData(locale)
        if (data) {
          // Use serialize-javascript to properly serialize the function
          outputFileSync(join(outDir, `${locale}.js`), serialize(data))
        }
      })
    )
  } else if (out) {
    outputFileSync(
      out,
      `// This file is generated from supported-locales-gen.ts
export const supportedLocales: string[] = ${JSON.stringify(locales)}
`
    )
  }
}
if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv))
}
