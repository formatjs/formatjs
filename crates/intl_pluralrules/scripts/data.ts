import {mkdirSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import minimist from 'minimist'
import plurals from 'cldr-core/supplemental/plurals.json' with {type: 'json'}
import ordinals from 'cldr-core/supplemental/ordinals.json' with {type: 'json'}
import pluralRanges from 'cldr-core/supplemental/pluralRanges.json' with {type: 'json'}
import {loadCompactExponents} from '#packages/intl-pluralrules/scripts/compact-exponents.ts'
import {getCanonicalLocales} from '@formatjs/intl-getcanonicallocales'
import {defaultContent} from '@formatjs_generated/cldr.supported-locales/default-content.js'

interface Args extends minimist.ParsedArgs {
  outDir: string
  locale: string | string[]
}
const cardinal = plurals.supplemental['plurals-type-cardinal'] as Record<
  string,
  Record<string, string>
>
const ordinal = ordinals.supplemental['plurals-type-ordinal'] as Record<
  string,
  Record<string, string>
>
const ranges = pluralRanges.supplemental.plurals as Record<
  string,
  Record<string, string>
>
const categories = ['zero', 'one', 'two', 'few', 'many']

function rules(input: Record<string, string> = {}): Record<string, string> {
  const result: Record<string, string> = {}
  for (const category of categories) {
    const rule = input[`pluralRule-count-${category}`]?.split('@')[0].trim()
    if (rule) result[category] = rule
  }
  return result
}
async function main(args: Args) {
  const locales = ([] as string[]).concat(args.locale || [])
  if (!args.outDir || !locales.length)
    throw new Error('--outDir and --locale are required')
  for (const locale of locales) {
    if (!Object.hasOwn(cardinal, locale))
      throw new Error('Unknown CLDR plural locale: ' + locale)
    const cardinalRules = rules(cardinal[locale]),
      ordinalRules = rules(ordinal[locale])
    const cardinalRanges: Record<string, string> = {}
    for (const [key, value] of Object.entries(ranges[locale] || {})) {
      const match =
        /^pluralRange-start-(zero|one|two|few|many|other)-end-(zero|one|two|few|many|other)$/.exec(
          key
        )
      if (!match) throw new Error('Invalid CLDR range key: ' + key)
      cardinalRanges[`${match[1]}_${match[2]}`] = value
    }
    const usesExponent = [
      ...Object.values(cardinalRules),
      ...Object.values(ordinalRules),
    ].some(rule => /\b[ce]\b/.test(rule))
    const pack = {
      formatVersion: 1,
      locale,
      aliases: defaultContent[getCanonicalLocales(locale)[0]] || [],
      cardinal: cardinalRules,
      ordinal: ordinalRules,
      ranges: {cardinal: cardinalRanges, ordinal: {}},
      ...(usesExponent
        ? {compactExponents: await loadCompactExponents(locale)}
        : {}),
    }
    const output = join(args.outDir, `${locale}.json`)
    mkdirSync(dirname(output), {recursive: true})
    writeFileSync(output, JSON.stringify(pack) + '\n')
  }
}
if (import.meta.filename === process.argv[1])
  await main(minimist<Args>(process.argv.slice(2)))
