import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {basename, join} from 'node:path'
import minimist from 'minimist'
import {getCanonicalLocales} from '@formatjs/intl-getcanonicallocales'
import {defaultContent} from '@formatjs_generated/cldr.supported-locales/default-content.js'

interface Args extends minimist.ParsedArgs {
  outDir: string
  cldrFile: string | string[]
}
function main(args: Args) {
  if (!args.outDir) throw new Error('--outDir required')
  mkdirSync(args.outDir, {recursive: true})
  for (const file of ([] as string[]).concat(args.cldrFile || [])) {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as {
      locale: string
      data: unknown
    }
    const locale = getCanonicalLocales(raw.locale)[0]
    const pack = {
      formatVersion: 1,
      ...raw,
      locale,
      aliases: defaultContent[locale] || [],
    }
    writeFileSync(
      join(args.outDir, basename(file)),
      JSON.stringify(pack) + '\n'
    )
  }
}
if (import.meta.filename === process.argv[1])
  main(minimist(process.argv.slice(2)) as Args)
