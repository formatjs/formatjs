import {mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs'
import {basename, join} from 'node:path'
import minimist from 'minimist'
import {getCanonicalLocales} from '@formatjs/intl-getcanonicallocales'
import {match} from '@formatjs/intl-localematcher'
import {defaultContent} from '@formatjs_generated/cldr.supported-locales/default-content.js'
import type {RelativeTimeLocaleData} from '#packages/ecma402-abstract/types/relative-time.js'
interface Args extends minimist.ParsedArgs {
  outDir: string
  numberDir: string
  pluralDir: string
  cldrFile: string | string[]
}
interface IndexedPack {
  locale: string
  aliases: string[]
}
function index(directory: string): Map<string, IndexedPack> {
  const records = new Map<string, IndexedPack>()
  for (const file of readdirSync(directory)
    .filter(file => file.endsWith('.json'))
    .sort()) {
    const pack = JSON.parse(
      readFileSync(join(directory, file), 'utf8')
    ) as IndexedPack
    const locale = getCanonicalLocales(pack.locale)[0]
    for (const tag of getCanonicalLocales([pack.locale, ...pack.aliases]))
      if (!records.has(tag) || tag === locale) records.set(tag, pack)
  }
  if (!records.has('en'))
    throw new Error('English fallback missing: ' + directory)
  return records
}
function main(args: Args) {
  if (!args.outDir || !args.numberDir || !args.pluralDir)
    throw new Error('--outDir, --numberDir and --pluralDir required')
  const numbers = index(args.numberDir),
    plurals = index(args.pluralDir)
  const numberLocales = [...numbers.keys()],
    pluralLocales = [...plurals.keys()]
  mkdirSync(args.outDir, {recursive: true})
  for (const file of ([] as string[]).concat(args.cldrFile || [])) {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as RelativeTimeLocaleData
    const locale = getCanonicalLocales(raw.locale)[0]
    const number =
      numbers.get(locale) || numbers.get(match([locale], numberLocales, 'en'))
    const plural =
      plurals.get(locale) || plurals.get(match([locale], pluralLocales, 'en'))
    if (!number || !plural)
      throw new Error('Missing internal formatter pack: ' + locale)
    writeFileSync(
      join(args.outDir, basename(file)),
      JSON.stringify({
        formatVersion: 1,
        locale,
        aliases: defaultContent[locale] || [],
        data: raw.data,
        number,
        plurals: plural,
      }) + '\n'
    )
  }
}
if (import.meta.filename === process.argv[1])
  main(minimist(process.argv.slice(2)) as Args)
