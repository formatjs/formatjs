import {join, basename} from 'path'
import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'
import {readFileSync} from 'fs'

interface Args extends minimist.ParsedArgs {
  cldrFile: string | string[]
  outDir: string
}
function main(args: Args) {
  const {outDir} = args
  const cldrFiles = ([] as string[]).concat(args.cldrFile || [])
  cldrFiles.sort()
  cldrFiles.forEach(cldrFile => {
    const locale = basename(cldrFile, '.json')
    // Dist all locale files to locale-data (JS)
    const data = JSON.stringify(JSON.parse(readFileSync(cldrFile, 'utf8')))
    outputFileSync(
      join(outDir, locale + '.js'),
      `/* @generated */	
// prettier-ignore
(function (data) {
  if (Intl.DateTimeFormat && typeof Intl.DateTimeFormat.__addLocaleData === 'function') {
    Intl.DateTimeFormat.__addLocaleData(data)
  } else {
    (globalThis.__FORMATJS_DATETIMEFORMAT_DATA__ = globalThis.__FORMATJS_DATETIMEFORMAT_DATA__ || []).push(data)
  }
})(JSON.parse(${JSON.stringify(data)}));
`
    )
    outputFileSync(join(outDir, locale + '.d.ts'), 'export {}')
  })
}
if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
