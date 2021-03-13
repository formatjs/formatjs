import {join} from 'path'
import {outputFileSync} from 'fs-extra'
import serialize from 'serialize-javascript'
import {PluralRulesLocaleData} from '@formatjs/ecma402-abstract'
import plurals from 'cldr-core/supplemental/plurals.json'
import minimist from 'minimist'

const Compiler = require('make-plural-compiler')
Compiler.load(
  require('cldr-core/supplemental/plurals.json'),
  require('cldr-core/supplemental/ordinals.json')
)

const languages = Object.keys(plurals.supplemental['plurals-type-cardinal'])

function generateLocaleData(locale: string): PluralRulesLocaleData | undefined {
  let compiler, fn
  compiler = new Compiler(locale, {cardinals: true, ordinals: true})
  fn = compiler.compile()

  return {
    data: {
      categories: compiler.categories,
      fn,
    },
    locale,
  }
}

function main(args: minimist.ParsedArgs) {
  const {outDir} = args

  for (const locale of languages) {
    try {
      ;(Intl as any).getCanonicalLocales(locale)
    } catch (e) {
      console.warn(`Invalid locale ${locale}`)
      continue
    }
    outputFileSync(
      join(outDir, `${locale}.js`),
      serialize(generateLocaleData(locale))
    )
  }
}
if (require.main === module) {
  main(minimist(process.argv))
}
