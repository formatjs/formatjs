import cldr from 'cldr-core/availableLocales.json' with {type: 'json'}
import {writeFileSync} from 'node:fs'
import minimist from 'minimist'
interface Args extends minimist.ParsedArgs {
  out: string
}
function main(args: Args) {
  const small = [
    'en',
    'en-GB',
    'fr',
    'es',
    'es-419',
    'pt-BR',
    'pt-PT',
    'zh',
    'zh-Hant',
    'bs',
    'sr-Latn',
  ]
  const lines = [
    `support\tfull\t${cldr.availableLocales.full.join(',')}`,
    `support\tsmall\t${small.join(',')}`,
  ]
  for (const set of ['full', 'small']) {
    for (const [name, requested] of [
      ['exact', 'en'],
      ['equivalent', 'en-US'],
      ['chinese', 'zh-TW'],
      ['spanish', 'es-MX'],
      ['serbian', 'sr-Latn-BA'],
      ['fuzzy', 'en-XZ'],
      ['multiple', 'en-GB,fr'],
      ['language_fallback', 'br'],
      ['regional_fallback', 'en-AU'],
      ['script_fallback', 'sr-Cyrl'],
    ]) {
      lines.push(`case\t${set}_${name}\t${set}\t${requested}`)
    }
  }
  const unseen = Array.from(
    {length: 20 * 26},
    (_, i) => `q${String.fromCharCode(97 + Math.floor(i / 26), 97 + (i % 26))}`
  )
  lines.push(`cycle\tfull_unseen\tfull\t${unseen.join(',')}`)
  writeFileSync(args.out, lines.join('\n') + '\n')
}
if (import.meta.filename === process.argv[1])
  main(minimist<Args>(process.argv.slice(2)))
