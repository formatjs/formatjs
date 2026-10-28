import {writeFileSync} from 'node:fs'
import minimist from 'minimist'
import links from '@formatjs_generated/tz/links.js'

interface Args extends minimist.ParsedArgs {
  out: string
}
function main(args: Args) {
  if (!args.out) throw new Error('--out required')
  writeFileSync(args.out, JSON.stringify(links) + '\n')
}
if (import.meta.filename === process.argv[1])
  main(minimist(process.argv.slice(2)) as Args)
