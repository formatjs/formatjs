import {join, basename} from 'path'
import {copyFileSync} from 'fs-extra/esm'
import {sync as globSync} from 'fast-glob'
import minimist from 'minimist'

function main(args: minimist.ParsedArgs) {
  const {cldrFolder, locales: localesToGen = '', out} = args
  const allFiles = globSync(join(cldrFolder, '*.json'))
  allFiles.sort()
  const locales = localesToGen
    ? localesToGen.split(',')
    : allFiles.map(f => basename(f, '.json'))
  copyFileSync(join(cldrFolder, `${locales[0]}.json`), out)
}

if (require.main === module) {
  main(minimist(process.argv))
}
