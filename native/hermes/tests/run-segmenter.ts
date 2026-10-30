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
          ? '--native-segmenter'
          : `--extensions=${resolve('native/hermes/extensions.hbc')}`,
        resolve('native/hermes/tests/segmenter_suite.js'),
      ],
      {encoding: 'utf8', timeout: 120_000, maxBuffer: 4 * 1024 * 1024}
    )
    if (result.error) throw result.error
    process.stdout.write(result.stdout || '')
    process.stderr.write(result.stderr || '')
    if (result.status !== 0)
      throw new Error(
        `Hermes Segmenter ${mode} failed: ${result.status ?? result.signal}`
      )
    const report = JSON.parse(result.stdout.trim())
    if (
      report.type !== 'Segmenter-conformance' ||
      report.cases < 160 ||
      report.assertions < 1000
    )
      throw new Error('Incomplete Segmenter integration coverage')
  }
}
if (import.meta.filename === process.argv[1]) main()
