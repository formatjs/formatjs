import {join, basename} from 'path'
import {outputFileSync, readFileSync} from 'fs-extra'
import minimist from 'minimist'
import {sync as globSync} from 'fast-glob'

function main(args: minimist.ParsedArgs) {
  const {cldrFolder, locales: localesToGen = '', out} = args
  const allFiles = globSync(join(cldrFolder, '*.js'))
  allFiles.sort()
  const locales = localesToGen
    ? localesToGen.split(',')
    : allFiles.map(f => basename(f, '.js'))

  outputFileSync(
    out,
    `/* @generated */
// prettier-ignore
// @ts-nocheck
export default ${readFileSync(join(cldrFolder, `${locales[0]}.js`))}
`
  )
}
if (require.main === module) {
  main(minimist(process.argv))
}
