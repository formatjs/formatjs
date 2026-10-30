import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

function main() {
  const resolve = (path: string) =>
    runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
  const rows = readFileSync(process.env.SEGMENTER_FIXTURES!, 'utf8')
    .trimEnd()
    .split('\n')
    .slice(1)
    .map(row => row.split('\t'))
  const profiles = readFileSync(process.env.SEGMENTER_TS_DIFFERENCES!, 'utf8')
    .trimEnd()
    .split('\n')
    .slice(1)
    .map(row => row.split('\t'))
  const fixture = join(process.env.TEST_TMPDIR!, 'segmenter-fixtures.js')
  writeFileSync(
    fixture,
    'globalThis.__SEGMENTER_FIXTURES = ' +
      JSON.stringify(rows) +
      ';globalThis.__SEGMENTER_TS_DIFFERENCES = ' +
      JSON.stringify(profiles)
  )
  for (const mode of ['source', 'bytecode']) {
    const result = spawnSync(
      resolve('native/hermes/hermes_runner'),
      [
        mode === 'source'
          ? '--native-segmenter'
          : `--extensions=${resolve('native/hermes/extensions.hbc')}`,
        fixture,
        resolve('native/hermes/tests/segmenter_oracle_suite.js'),
      ],
      {encoding: 'utf8', timeout: 120_000, maxBuffer: 4 * 1024 * 1024}
    )
    if (result.error) throw result.error
    if (result.status !== 0)
      throw new Error(
        `Segmenter ICU ${mode}: ${result.stderr || result.stdout}`
      )
    const report = JSON.parse(result.stdout.trim())
    if (
      report.type !== 'Segmenter-ICU-conformance' ||
      report.cases !== 3540 ||
      report.assertions < 10000
    )
      throw new Error('Incomplete independent Segmenter oracle coverage')
    console.log(JSON.stringify({mode, ...report}))
  }
}
if (import.meta.filename === process.argv[1]) main()
