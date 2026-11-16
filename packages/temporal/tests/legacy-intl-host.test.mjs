import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {runfiles} from '@bazel/runfiles'

const harness = runfiles.resolve(process.argv[2])
const prelude = runfiles.resolve(process.argv[3])
const root = process.argv[4]
function run(adapted) {
  const result = spawnSync(
    harness,
    [
      '--threads',
      '4',
      '--errorForFailures',
      '--reporter',
      'json',
      '--reporter-keys',
      'file,scenario,result',
      '--test262Dir',
      root,
      '--featuresExclude',
      'Temporal',
      ...(adapted ? ['--prelude', prelude] : []),
      root + '/test/intl402/DateTimeFormat/**/*.js',
    ],
    {
      encoding: 'utf8',
      timeout: 300000,
      maxBuffer: 16 * 1024 * 1024,
      env: {...process.env, BAZEL_BINDIR: '.'},
    }
  )
  if (result.error) throw result.error
  assert([0, 1].includes(result.status), result.stderr)
  const rows = JSON.parse(result.stdout)
  assert.equal(rows.length, 362, 'Complete non-Temporal formatter selection')
  const cases = new Map(
    rows.map(row => [row.file + ':' + row.scenario, row.result])
  )
  assert.equal(cases.size, rows.length, 'Unique test scenarios')
  return cases
}

const native = run(false)
const adapted = run(true)
assert.deepEqual([...adapted.keys()].sort(), [...native.keys()].sort())
const regressions = [...adapted].filter(
  ([key, result]) => !result.pass && native.get(key).pass
)
assert.deepEqual(
  regressions,
  [],
  'Installing Temporal must preserve native formatter behavior'
)
console.log(
  `${adapted.size} non-Temporal executions; no new failures (${[...native.values()].filter(result => !result.pass).length} native diagnostics)`
)
