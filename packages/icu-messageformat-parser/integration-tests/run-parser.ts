import {_Parser} from '@formatjs/icu-messageformat-parser'
import fs from 'fs'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  input: string
  out: string
}

function run({input, out}: Args) {
  console.log(__dirname)
  const sections = fs.readFileSync(input, 'utf-8').split('\n---\n')
  const message = sections[0]
  const snapshotOptions = JSON.parse(sections[1])
  const options = {...snapshotOptions}
  // Note: allow locale to be specified via an identifier.
  if (options.locale) {
    options.locale = new Intl.Locale(options.locale)
  }

  const parsed = new _Parser(message, options).parse()

  // If the mismatch is intentional, use `UPDATE_SNAPSHOT=1` env var
  // with bazel run to update the snapshot.
  fs.writeFileSync(
    out,
    [
      message,
      JSON.stringify(snapshotOptions, null, 2),
      JSON.stringify(parsed, null, 2),
    ].join('\n---\n'),
    'utf-8'
  )
}

if (require.main === module) {
  run(minimist<Args>(process.argv.slice(2)))
}
