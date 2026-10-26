import {writeFileSync} from 'node:fs'
import minimist from 'minimist'
import {defaultContent} from '@formatjs_generated/cldr.supported-locales/default-content.js'

interface Args extends minimist.ParsedArgs {
  out: string
}
function main(args: Args) {
  if (!args.out) throw new Error('--out required')
  writeFileSync(args.out, JSON.stringify(defaultContent) + '\n')
}
if (import.meta.filename === process.argv[1])
  main(minimist(process.argv.slice(2)) as Args)
