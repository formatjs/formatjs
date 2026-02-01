import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  out: string
  locale: string
  type: string
}

function main(args: Args) {
  const {out, locale, type} = args

  if (!out) {
    throw new Error('--out is required')
  }

  if (!locale) {
    throw new Error('--locale is required')
  }

  if (!type) {
    throw new Error('--type is required')
  }

  const pluralLocale = locale.split('-')[0]

  const content = `import "@formatjs/intl-pluralrules/locale-data/${pluralLocale}.js"
import { test } from "./${type}Test"
import localeData from "../locale-data/${locale}.json" with {type: 'json'}
test("${locale}", localeData);
`

  outputFileSync(out, content)
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv))
}
