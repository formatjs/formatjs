import minimist from 'minimist'
import {outputFileSync} from 'fs-extra'
interface Args extends minimist.ParsedArgs {
  zone: string[]
}
function main(args: Args) {
  const {out, zone: timezones} = args

  // Output numbering systems file
  outputFileSync(
    out,
    `export const timezones = ${JSON.stringify(timezones)} as const
export type Timezone = typeof timezones[number]
    `
  )
}

if (require.main === module) {
  main(minimist<Args>(process.argv))
}
