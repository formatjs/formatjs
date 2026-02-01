import {join} from 'path'
import {outputFileSync} from 'fs-extra/esm'
import serialize from 'serialize-javascript'
import {type LDMLPluralRule} from '@formatjs/ecma402-abstract'
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

function generateLocaleData(locale: string): LocaleData | undefined {
  const cardinalRules = cardinalsData[locale]
  const ordinalRules = ordinalsData[locale]

  // Implementation: Compile CLDR plural rules to optimized JavaScript function
  const compiler = new PluralRulesCompiler(locale, cardinalRules, ordinalRules)
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

function main(args: Args) {
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
    locales.forEach(locale => {
      console.log(join(outDir, `${locale}.js`))
      const data = generateLocaleData(locale)
      if (data) {
        // Use serialize-javascript to properly serialize the function
        outputFileSync(join(outDir, `${locale}.js`), serialize(data))
      }
    })
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
