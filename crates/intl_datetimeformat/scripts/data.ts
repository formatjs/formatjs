import {mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs'
import {basename, join} from 'node:path'
import minimist from 'minimist'
import {getCanonicalLocales} from '@formatjs/intl-getcanonicallocales'
import {match} from '@formatjs/intl-localematcher'

interface Args extends minimist.ParsedArgs {
  outDir: string
  numberDir: string
  cldrFile: string | string[]
}
interface IndexedPack {
  locale: string
  aliases: string[]
}
interface DatePack {
  locale: string
  data: unknown
}
function main(args: Args) {
  if (!args.outDir || !args.numberDir)
    throw new Error('--outDir and --numberDir required')
  const numbers = new Map<string, IndexedPack>()
  for (const file of readdirSync(args.numberDir)
    .filter(file => file.endsWith('.json'))
    .sort()) {
    const pack = JSON.parse(
      readFileSync(join(args.numberDir, file), 'utf8')
    ) as IndexedPack
    const locale = getCanonicalLocales(pack.locale)[0]
    for (const tag of getCanonicalLocales([pack.locale, ...pack.aliases]))
      if (!numbers.has(tag) || tag === locale) numbers.set(tag, pack)
  }
  if (!numbers.has('en')) throw new Error('English number fallback missing')
  const available = [...numbers.keys()]
  mkdirSync(args.outDir, {recursive: true})
  for (const file of ([] as string[]).concat(args.cldrFile || [])) {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as DatePack
    const locale = getCanonicalLocales(raw.locale)[0]
    const number =
      numbers.get(locale) || numbers.get(match([locale], available, 'en'))
    if (!number) throw new Error('Missing number pack: ' + locale)
    writeFileSync(
      join(args.outDir, basename(file)),
      JSON.stringify({...raw, number}) + '\n'
    )
  }
}
if (import.meta.filename === process.argv[1])
  main(minimist(process.argv.slice(2)) as Args)
