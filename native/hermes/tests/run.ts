import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'

function main() {
  const resolve = (path: string) =>
    runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
  const result = spawnSync(
    resolve('native/hermes/hermes_runner'),
    [
      `--prelude=${resolve('native/hermes/tests/formatter_prelude.js')}`,
      resolve('native/hermes/tests/supported_values_suite.js'),
    ],
    {encoding: 'utf8', timeout: 120_000}
  )
  if (result.error) throw result.error
  process.stdout.write(result.stdout || '')
  process.stderr.write(result.stderr || '')
  if (result.status !== 0)
    throw new Error(
      `Hermes conformance failed: ${result.status ?? result.signal}`
    )
  const report = JSON.parse(result.stdout.trim())
  if (
    report.type !== 'supportedValuesOf-conformance' ||
    report.keys !== 6 ||
    report.assertions < 70 ||
    report.candidate !== 'Rust JSI installed API' ||
    report.backend !== 'TypeScript formatters'
  ) {
    throw new Error('Incomplete supportedValuesOf integration coverage')
  }
}

if (import.meta.filename === process.argv[1]) main()
