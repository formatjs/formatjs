import {readFileSync, readdirSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {createRequire} from 'node:module'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  out: string
}
function main(args: Args) {
  if (!args.out) throw new Error('--out required')
  const require = createRequire(import.meta.url)
  const root = join(
    dirname(require.resolve('cldr-cal-islamic-full/package.json')),
    'main'
  )
  const labels: Record<string, string[]> = Object.create(null)
  const available = new Set(readdirSync(root))
  for (const locale of readdirSync(root).sort(
    (a, b) => a.split('-').length - b.split('-').length || a.localeCompare(b)
  )) {
    const data = JSON.parse(
      readFileSync(join(root, locale, 'ca-islamic.json'), 'utf8')
    )
    const eras = data.main[locale].dates.calendars.islamic.eras
    const value = [eras.eraNames['1'], eras.eraAbbr['1'], eras.eraNarrow['1']]
    if (value.some(label => typeof label !== 'string'))
      throw new Error(`Missing Before Hijrah labels: ${locale}`)
    let parent = locale
    while (parent.includes('-')) {
      parent = parent.slice(0, parent.lastIndexOf('-'))
      if (labels[parent]) break
    }
    if (
      parent !== locale &&
      JSON.stringify(labels[parent]) === JSON.stringify(value)
    )
      continue
    labels[locale] = value
  }
  const lookup = (locale: string): string[] => {
    while (!labels[locale] && locale.includes('-'))
      locale = locale.slice(0, locale.lastIndexOf('-'))
    return labels[locale] ?? labels.en
  }
  const parents = require('cldr-core/supplemental/parentLocales.json')
    .supplemental.parentLocales.parentLocale as Record<string, string>
  for (const [locale, parent] of Object.entries(parents)) {
    if (
      !available.has(locale) &&
      JSON.stringify(lookup(locale)) !== JSON.stringify(lookup(parent))
    )
      labels[locale] = lookup(parent)
  }
  writeFileSync(
    args.out,
    `export const beforeHijrah: Record<string, readonly string[]> = ${JSON.stringify(labels)};\n`
  )
}
if (import.meta.filename === process.argv[1])
  main(minimist<Args>(process.argv.slice(2)))
