import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'

function main() {
  const resolve = (path: string) =>
    runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
  const kinds = process.argv.slice(2)
  for (const mode of ['source', 'bytecode']) {
    const args =
      mode === 'source'
        ? kinds.map(kind => `--native-${kind}`)
        : [`--extensions=${resolve('native/hermes/extensions.hbc')}`]
    const result = spawnSync(
      resolve('native/hermes/hermes_runner'),
      [...args, resolve('native/hermes/tests/compiled_locales_suite.js')],
      {encoding: 'utf8', timeout: 60_000}
    )
    if (result.error) throw result.error
    if (result.status !== 0)
      throw new Error(
        `Compiled locales ${mode}: ${result.stderr || result.stdout}`
      )
    const report = JSON.parse(result.stdout.trim())
    if (
      report.type !== 'compiled-locales' ||
      report.assertions === 0 ||
      JSON.stringify(report.kinds) !== JSON.stringify(kinds)
    )
      throw new Error('Incomplete compiled locale coverage')
    console.log(JSON.stringify({mode, ...report}))
  }
}
if (import.meta.filename === process.argv[1]) main()
