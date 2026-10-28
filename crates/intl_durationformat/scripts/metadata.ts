import {writeFileSync} from 'node:fs'
import minimist from 'minimist'
import {TIME_SEPARATORS} from '@formatjs_generated/cldr.number/time-separators.js'
import {numberingSystemNames} from '@formatjs_generated/cldr.number/numbering-systems.js'
interface Args extends minimist.ParsedArgs {
  out: string
}
function main(args: Args) {
  if (!args.out) throw new Error('--out required')
  writeFileSync(
    args.out,
    JSON.stringify({
      available: Object.keys(TIME_SEPARATORS.localeData),
      defaultSeparator: TIME_SEPARATORS.default,
      locales: TIME_SEPARATORS.localeData,
      numberingSystems: numberingSystemNames,
    }) + '\n'
  )
}
if (import.meta.filename === process.argv[1])
  main(minimist(process.argv.slice(2)) as Args)
