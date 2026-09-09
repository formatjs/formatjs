import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'
import localeData from 'cldr-core/availableLocales.json' with {type: 'json'}
import content from 'cldr-core/defaultContent.json' with {type: 'json'}

interface Args extends minimist.ParsedArgs {
  out: string
}

function main(args: Args) {
  if (!args.out) throw new Error('--out is required')
  // LDML locale inheritance gives a default-content child its parent's data.
  // This maps identical data records; it does not perform likely-subtag matching.
  // https://unicode.org/reports/tr35/tr35.html#Locale_Inheritance
  // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35.md#L1839-L1841
  const children: Record<string, string[]> = Object.create(null)
  for (const locale of content.defaultContent) {
    const parent = locale.split('-').slice(0, -1).join('-')
    ;(children[parent] ||= []).push(locale)
  }
  // ECMA-402 §9.1 also requires less-specific and scriptless fallback tags.
  // https://tc39.es/ecma402/#sec-internal-slots
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L18-L22
  const locales = new Set([
    ...localeData.availableLocales.full,
    ...content.defaultContent,
  ])
  for (const locale of locales) {
    const parts = locale.split('-')
    while (parts.length > 1) {
      if (parts.length > 2 && parts[1].length === 4)
        locales.add([parts[0], ...parts.slice(2)].join('-'))
      parts.pop()
      locales.add(parts.join('-'))
    }
  }
  outputFileSync(
    args.out,
    `export const defaultContent: Record<string, string[]> = ${JSON.stringify(children)}\nexport const availableLocales: string[] = ${JSON.stringify([...locales].sort())}\n`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
