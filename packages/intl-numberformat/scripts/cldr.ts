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
    const data = readFileSync(cldrFile, 'utf-8')
    outputFileSync(
      join(outDir, locale + '.js'),
      `/* @generated */
// prettier-ignore
;(function (data) {
  if (Intl.NumberFormat && typeof Intl.NumberFormat.__addLocaleData === 'function') {
    Intl.NumberFormat.__addLocaleData(data)
  } else {
    (globalThis.__FORMATJS_NUMBERFORMAT_DATA__ = globalThis.__FORMATJS_NUMBERFORMAT_DATA__ || []).push(data)
  }
})(${data});
`
    )
    outputFileSync(join(outDir, locale + '.d.ts'), 'export {}')
  })
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
