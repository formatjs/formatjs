import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname} from 'node:path'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  input: string
  out: string
}

function main(args: Args) {
  const directions: Record<string, 'ltr' | 'rtl'> = {}
  for (const source of readFileSync(args.input, 'utf8').split('\n')) {
    const line = source.split('#', 1)[0].trim()
    if (!line) continue
    const fields = line.split(';').map(value => value.trim())
    if (fields.length < 7 || !/^[A-Z][a-z]{3}$/.test(fields[0])) {
      throw new Error(`Invalid CLDR script metadata: ${line}`)
    }
    if (fields[6] === 'YES') directions[fields[0]] = 'rtl'
    else if (fields[6] === 'NO') directions[fields[0]] = 'ltr'
    else if (fields[6] !== 'UNKNOWN')
      throw new Error(`Unknown direction: ${line}`)
  }
  if (directions.Arab !== 'rtl' || directions.Latn !== 'ltr') {
    throw new Error('Incomplete CLDR script metadata')
  }
  const sorted = Object.fromEntries(
    Object.keys(directions)
      .sort()
      .map(key => [key, directions[key]])
  )
  mkdirSync(dirname(args.out), {recursive: true})
  writeFileSync(
    args.out,
    `// @generated\nexport const scriptDirections: Record<string, 'ltr' | 'rtl' | undefined> = ${JSON.stringify(sorted)}\n`
  )
}

if (import.meta.filename === process.argv[1])
  main(minimist<Args>(process.argv.slice(2)))
