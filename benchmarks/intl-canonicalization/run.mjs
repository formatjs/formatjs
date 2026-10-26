import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

if (process.argv.includes('--oracle')) {
  const tags = [
    'hye-Latn-SU',
    'hye-Armn-SU',
    'hye-Latn-SU-arevmda',
    'hye-Armn-SU-arevmda',
    'hy-Latn-SU',
    'hy-Armn-SU',
    'und-Armn-SU',
    'abcde-Armn-SU',
    'root',
  ]
  console.log(
    JSON.stringify({
      type: 'node-oracle',
      versions: process.versions,
      results: tags.map(tag => {
        try {
          return {tag, canonical: Intl.getCanonicalLocales(tag)}
        } catch (error) {
          return {tag, error: error.name}
        }
      }),
    })
  )
} else {
  const workspace = process.env.TEST_WORKSPACE || '_main'
  const resolve = value => runfiles.resolve(`${workspace}/${value}`)
  const testOnly = process.argv.includes('--test')
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'formatjs-canonical-')
  )
  try {
    const options = path.join(directory, 'options.js')
    fs.writeFileSync(
      options,
      `globalThis.FORMATJS_CANONICAL_TEST_ONLY = ${testOnly};\n`
    )
    const result = spawnSync(
      resolve('native/hermes/hermes_runner'),
      [
        ...(testOnly
          ? [`--prelude=${resolve('tools/hermes-test262/locale_prelude.js')}`]
          : []),
        options,
        resolve('benchmarks/intl-canonicalization/suite_bundle.js'),
      ],
      testOnly ? {encoding: 'utf8'} : {stdio: 'inherit'}
    )
    if (result.error) throw result.error
    if (result.signal) throw new Error(`Hermes terminated: ${result.signal}`)
    if (testOnly) {
      process.stdout.write(result.stdout || '')
      process.stderr.write(result.stderr || '')
      if (result.status === 0) {
        const reports = result.stdout
          .trim()
          .split('\n')
          .map(line => JSON.parse(line))
        const report = reports.find(value => value.type === 'correctness')
        if (
          report?.candidate !== 'Rust JSI installed API' ||
          report.reference !==
            '@formatjs/intl-getcanonicallocales TypeScript source' ||
          !report.observable?.cases ||
          !report.observable.localeCases ||
          !report.observable.invalidTags ||
          !report.casingVariants
        )
          throw new Error(
            'Hermes differential conformance report missing coverage'
          )
      }
    }
    process.exitCode = result.status ?? 1
  } finally {
    fs.rmSync(directory, {recursive: true, force: true})
  }
}
