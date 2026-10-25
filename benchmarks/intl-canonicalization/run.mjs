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
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'formatjs-canonical-')
  )
  try {
    const options = path.join(directory, 'options.js')
    fs.writeFileSync(
      options,
      `globalThis.FORMATJS_CANONICAL_TEST_ONLY = ${process.argv.includes('--test')};\n`
    )
    const result = spawnSync(
      resolve('native/hermes/hermes_runner'),
      [options, resolve('benchmarks/intl-canonicalization/suite_bundle.js')],
      {stdio: 'inherit'}
    )
    if (result.error) throw result.error
    if (result.signal) throw new Error(`Hermes terminated: ${result.signal}`)
    process.exitCode = result.status ?? 1
  } finally {
    fs.rmSync(directory, {recursive: true, force: true})
  }
}
