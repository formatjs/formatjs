import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'

function main() {
  const kind = process.argv[2]
  if (!/^[a-z]+$/.test(kind)) throw Error('Formatter argument required')
  const resolve = (path: string) =>
    runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
  const directory = resolve(`native/hermes/tests/${kind}_package_bundles`)
  const manifest = JSON.parse(
    readFileSync(join(directory, 'manifest.json'), 'utf8')
  ) as {file: string; source: string; snapshots: number}[]
  let failed = 0
  for (const mode of ['source', 'bytecode']) {
    let passed = 0,
      assertions = 0,
      snapshots = 0,
      skipped = 0
    for (const entry of manifest) {
      const result = spawnSync(
        resolve('native/hermes/hermes_runner'),
        [
          ...(kind === 'datetimeformat' ? ['--es6-block-scoping'] : []),
          ...(kind === 'datetimeformat'
            ? [
                `--prelude=${resolve('native/hermes/tests/datetimeformat_prelude.js')}`,
              ]
            : []),
          ...(mode === 'source'
            ? ['getcanonicallocales', 'supportedvaluesof', 'locale'].includes(
                kind
              )
              ? []
              : [`--native-${kind}`]
            : [`--extensions=${resolve('native/hermes/extensions.hbc')}`]),
          join(directory, entry.file),
        ],
        {
          encoding: 'utf8',
          timeout: 300_000,
          maxBuffer: 8 * 1024 * 1024,
          env: {...process.env, TZ: 'UTC'},
        }
      )
      if (result.error) throw result.error
      const line = result.stdout
        .trim()
        .split('\n')
        .find(line => line.startsWith('{"passed":'))
      if (line) {
        const report = JSON.parse(line)
        passed += report.passed
        assertions += report.assertions
        snapshots += report.snapshots
        skipped += report.skipped
        if (
          !report.passed ||
          report.snapshots !== entry.snapshots ||
          report.failures.length
        ) {
          console.error(
            `${kind}/${entry.source} ${mode}: ${JSON.stringify(report)}`
          )
          failed++
        }
      }
      if (!line || result.status !== 0) {
        console.error(
          `${kind}/${entry.source} ${mode}: ${result.stderr || result.stdout}`
        )
        failed++
      }
    }
    console.log(
      JSON.stringify({
        kind,
        mode,
        files: manifest.length,
        passed,
        assertions,
        snapshots,
        skipped,
        failed,
      })
    )
  }
  if (failed) throw Error(`${failed} package conformance failures`)
}
if (import.meta.filename === process.argv[1]) main()
