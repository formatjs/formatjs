import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

function main() {
  const resolve = (path: string) =>
    runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
  const kinds = process.argv.slice(2)
  const suite = kinds[0]?.startsWith('--suite=')
    ? kinds.shift()!.slice('--suite='.length)
    : 'compiled_locales_suite.js'
  const fixtures: string[] = []
  for (const [variable, name] of [
    ['LOCALE_FORMAT_FIXTURES', '__LOCALE_FORMAT_FIXTURES'],
    ['LIST_FORMAT_FIXTURES', '__LIST_FORMAT_FIXTURES'],
  ]) {
    const source = process.env[variable]
    if (!source) continue
    const rows = readFileSync(source, 'utf8')
      .trimEnd()
      .split('\n')
      .slice(1)
      .map(row => row.split('\t'))
    const path = join(process.env.TEST_TMPDIR!, `${variable}.js`)
    writeFileSync(path, `globalThis.${name} = ` + JSON.stringify(rows))
    fixtures.push(path)
  }
  for (const mode of ['source', 'bytecode']) {
    const args =
      mode === 'source'
        ? kinds.map(kind => `--native-${kind}`)
        : [`--extensions=${resolve('native/hermes/extensions.hbc')}`]
    const result = spawnSync(
      resolve('native/hermes/hermes_runner'),
      [...args, ...fixtures, resolve(`native/hermes/tests/${suite}`)],
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
