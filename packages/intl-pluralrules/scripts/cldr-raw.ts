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
      } catch (e) {
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
