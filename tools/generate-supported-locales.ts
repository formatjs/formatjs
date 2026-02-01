import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  out: string
  _: string[]
}

function main(args: Args) {
  const {out, _: locales} = args

  if (!out) {
    throw new Error('--out is required')
  }

  if (locales.length === 0) {
    throw new Error('must have at least one locale')
  }

  const content = `export const supportedLocales: string[] = ${JSON.stringify(locales, null, 2)}\n`

  outputFileSync(out, content)
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
