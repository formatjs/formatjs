import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'
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
  outputFileSync(
    args.out,
    `export const defaultContent: Record<string, string[]> = ${JSON.stringify(children)}\n`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
