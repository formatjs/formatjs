import {join} from 'path'
import {outputFileSync} from 'fs-extra/esm'
import serialize from 'serialize-javascript'
import {
  type PluralRulesLocaleData,
  type LDMLPluralRule,
} from '@formatjs/ecma402-abstract'
import plurals from 'cldr-core/supplemental/plurals.json'
import ordinals from 'cldr-core/supplemental/ordinals.json'
import pluralRanges from 'cldr-core/supplemental/pluralRanges.json'
import minimist from 'minimist'
import {PluralRulesCompiler} from './plural-rules-compiler.js'

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

function generateLocaleData(locale: string): PluralRulesLocaleData | undefined {
  const cardinalRules = cardinalsData[locale]
  const ordinalRules = ordinalsData[locale]

  const compiler = new PluralRulesCompiler(locale, cardinalRules, ordinalRules)
  const fn = compiler.compile()
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
    locales.forEach(
      locale =>
        +console.log(join(outDir, `${locale}.js`)) ||
        outputFileSync(
          join(outDir, `${locale}.js`),
          serialize(generateLocaleData(locale))
        )
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
if (require.main === module) {
  main(minimist<Args>(process.argv))
}
