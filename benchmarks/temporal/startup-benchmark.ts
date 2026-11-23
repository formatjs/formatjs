import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {cpus} from 'node:os'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

const directory = runfiles.resolve(process.argv[2])
const profiles = {
  typescript: pathToFileURL(join(directory, 'index.js')).href,
  reference: import.meta.resolve('temporal-polyfill/implementation'),
  officialReference: import.meta.resolve('@js-temporal/polyfill'),
}
const child = `
const start = performance.now()
const {Temporal} = await import(process.argv[1])
const imported = performance.now()
const instant = Temporal.Instant.from('2020-02-29T23:59:59.123456789+05:45')
const date = instant.toZonedDateTimeISO('America/New_York').toPlainDate()
const end = performance.now()
console.log(JSON.stringify({importMilliseconds: imported-start, firstOperationMilliseconds: end-imported, totalMilliseconds: end-start, result: [instant.epochNanoseconds.toString(), date.toString()]}))
`
interface Startup {
  importMilliseconds: number
  firstOperationMilliseconds: number
  totalMilliseconds: number
  result: string[]
}
const results: Record<string, Startup[]> = {}
const names = Object.keys(profiles) as (keyof typeof profiles)[]
const env: NodeJS.ProcessEnv = {...process.env, NODE_DISABLE_COMPILE_CACHE: '1'}
delete env.NODE_COMPILE_CACHE
let expected: string[] | undefined
for (let round = 0; round < 9; round++) {
  for (let index = 0; index < names.length; index++) {
    const name = names[(round + index) % names.length]
    const processResult = spawnSync(
      process.execPath,
      ['--input-type=module', '--eval', child, profiles[name]],
      {encoding: 'utf8', env}
    )
    assert.equal(processResult.status, 0, processResult.stderr)
    const value = JSON.parse(processResult.stdout) as Startup
    if (expected) assert.deepEqual(value.result, expected)
    else expected = value.result
    ;(results[name] ??= []).push(value)
  }
}
const median = (values: number[]) =>
  [...values].sort((a, b) => a - b)[values.length >> 1]
console.log(
  JSON.stringify(
    {
      node: process.version,
      v8: process.versions.v8,
      icu: process.versions.icu,
      cpu: cpus()[0]?.model,
      method:
        'Nine fresh Node processes per profile, rotated order, persistent compile cache disabled. Dynamic import then first Instant parse and named-zone projection/date creation. Matched outputs. Timings exclude process launch and result formatting; include module compilation/evaluation and first-use data setup. Default TS and both references use host Intl timezone data. ISO/Gregorian only; no full calendar initialization, native Rust or Hermes startup claim.',
      medians: Object.fromEntries(
        names.map(name => [
          name,
          {
            importMilliseconds: median(
              results[name].map(value => value.importMilliseconds)
            ),
            firstOperationMilliseconds: median(
              results[name].map(value => value.firstOperationMilliseconds)
            ),
            totalMilliseconds: median(
              results[name].map(value => value.totalMilliseconds)
            ),
          },
        ])
      ),
      samples: results,
    },
    null,
    2
  )
)
