import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
function main() {
  const resolve = (path: string) =>
    runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
  for (const mode of ['source', 'bytecode']) {
    const result = spawnSync(
      resolve('native/hermes/hermes_runner'),
      [
        mode === 'source'
          ? '--native-collator'
          : `--extensions=${resolve('native/hermes/extensions.hbc')}`,
        resolve('native/hermes/tests/collator_suite.js'),
      ],
      {encoding: 'utf8', timeout: 180_000, maxBuffer: 4 * 1024 * 1024}
    )
    if (result.error) throw result.error
    process.stdout.write(result.stdout || '')
    process.stderr.write(result.stderr || '')
    if (result.status !== 0)
      throw new Error(
        `Hermes Collator ${mode} failed: ${result.status ?? result.signal}`
      )
    const report = JSON.parse(result.stdout.trim())
    if (
      report.type !== 'Collator-conformance' ||
      report.candidate !== 'Rust JSI installed API' ||
      report.reference !== 'TypeScript implementation' ||
      report.cases < 6000 ||
      report.assertions < 10000
    )
      throw new Error('Incomplete Collator integration coverage')
  }
}
if (import.meta.filename === process.argv[1]) main()
