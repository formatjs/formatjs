import {mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs'
import {basename, join} from 'node:path'
import minimist from 'minimist'
import {getCanonicalLocales} from '@formatjs/intl-getcanonicallocales'
import {match} from '@formatjs/intl-localematcher'
import {defaultContent} from '@formatjs_generated/cldr.supported-locales/default-content.js'
import type {RawNumberLocaleData} from '#packages/ecma402-abstract/types/number.js'

interface Args extends minimist.ParsedArgs {
  outDir: string
  pluralDir: string
  cldrFile: string | string[]
}
interface PluralPack {
  locale: string
  aliases: string[]
}
function main(args: Args) {
  if (!args.outDir || !args.pluralDir)
    throw new Error('--outDir and --pluralDir required')
  const pluralData = new Map<string, PluralPack>()
  for (const file of readdirSync(args.pluralDir)
    .filter(file => file.endsWith('.json'))
    .sort()) {
    const pack = JSON.parse(
      readFileSync(join(args.pluralDir, file), 'utf8')
    ) as PluralPack
    const locale = getCanonicalLocales(pack.locale)[0]
    // ResolveLocale canonicalizes supported tags too (sh becomes sr-Latn).
    // Match the runtime registry's keys before indexing the selected payload.
    for (const tag of getCanonicalLocales([pack.locale, ...pack.aliases]))
      if (!pluralData.has(tag) || tag === locale) pluralData.set(tag, pack)
  }
  if (!pluralData.has('en')) throw new Error('English plural fallback missing')
  const available = [...pluralData.keys()]
  mkdirSync(args.outDir, {recursive: true})
  for (const file of ([] as string[]).concat(args.cldrFile || [])) {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as RawNumberLocaleData
    if (!raw.data?.numbers)
      throw new Error('Missing NumberFormat data for ' + raw.locale)
    const locale = getCanonicalLocales(raw.locale)[0]
    const selected = match([locale], available, 'en')
    const plurals = pluralData.get(selected)
    if (!plurals)
      throw new Error(`Missing plural pack ${selected} for ${locale}`)
    const pack = {
      formatVersion: 1,
      locale,
      aliases: defaultContent[locale] || [],
      data: raw.data,
      plurals,
    }
    writeFileSync(
      join(args.outDir, basename(file)),
      JSON.stringify(pack) + '\n'
    )
  }
}
if (import.meta.filename === process.argv[1])
  main(minimist(process.argv.slice(2)) as Args)
