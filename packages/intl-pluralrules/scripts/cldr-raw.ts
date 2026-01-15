import {join} from 'path'
import {outputFileSync} from 'fs-extra/esm'
import serialize from 'serialize-javascript'
import {type PluralRulesLocaleData} from '@formatjs/ecma402-abstract'
import plurals from 'cldr-core/supplemental/plurals.json'
import ordinals from 'cldr-core/supplemental/ordinals.json'
import minimist from 'minimist'
import {PluralRulesCompiler} from './plural-rules-compiler.js'

const cardinalsData = plurals.supplemental['plurals-type-cardinal']
const ordinalsData = ordinals.supplemental['plurals-type-ordinal']

const languages = Object.keys(cardinalsData)

function generateLocaleData(locale: string): PluralRulesLocaleData | undefined {
  const cardinalRules = cardinalsData[locale]
  const ordinalRules = ordinalsData[locale]

  const compiler = new PluralRulesCompiler(locale, cardinalRules, ordinalRules)
  const fn = compiler.compile()

  return {
    data: {
      categories: compiler.categories,
      fn,
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
