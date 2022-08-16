import {join, basename} from 'path'
import {outputFileSync} from 'fs-extra'
import minimist from 'minimist'
import {sync as globSync} from 'fast-glob'

interface Args extends minimist.ParsedArgs {
  cldrFolder: string
  out: string
}

function main(args: Args) {
  console.log(args, '------')
  throw new Error('asd')
  const {cldrFolder, out} = args
  const allFiles = globSync(join(cldrFolder, '*.js*'))
  allFiles.sort()
  const locales = allFiles.map(f =>
    basename(f, f.endsWith('.json') ? '.json' : '.js')
  )

  outputFileSync(
    out,
    `// This file is generated from supported-locales-gen.ts
export const supportedLocales: string[] = ${JSON.stringify(locales)}`
  )
}
if (require.main === module) {
  main(minimist<Args>(process.argv))
}
