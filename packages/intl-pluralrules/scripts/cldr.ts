import {join, basename} from 'path'
import {outputFileSync, readFileSync} from 'fs-extra'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  cldrFile: string[]
}
function main(args: Args) {
  const {cldrFile: cldrFiles, outDir} = args
  cldrFiles.sort()
  cldrFiles.forEach(cldrFile => {
    const locale = basename(cldrFile, '.js')
    // Dist all locale files to locale-data (JS)
    const data = readFileSync(cldrFile)
    outputFileSync(
      join(outDir, locale + '.js'),
      `/* @generated */
// prettier-ignore
if (Intl.PluralRules && typeof Intl.PluralRules.__addLocaleData === 'function') {
  Intl.PluralRules.__addLocaleData(${data})
}
`
    )
    outputFileSync(join(outDir, locale + '.d.ts'), 'export {}')
  })
}
if (require.main === module) {
  main(minimist<Args>(process.argv))
}
