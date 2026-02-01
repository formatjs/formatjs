import {join, basename} from 'path'
import {copyFileSync} from 'fs-extra/esm'
import minimist from 'minimist'
import glob from 'fast-glob'
const globSync = glob.sync

function main(args: minimist.ParsedArgs) {
  const {cldrFolder, locales: localesToGen = '', out} = args
  const allFiles = globSync(join(cldrFolder, '*.json'))
  allFiles.sort()
  const locales = localesToGen
    ? localesToGen.split(',')
    : allFiles.map(f => basename(f, '.json'))

  copyFileSync(join(cldrFolder, `${locales[0]}.json`), out)
}

if (import.meta.filename === process.argv[1]) {
  main(minimist(process.argv))
}
