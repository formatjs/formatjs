import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync, readdirSync} from 'node:fs'
import {join} from 'node:path'
import {expect, it} from 'vitest'
import {getCanonicalLocales} from '@formatjs/intl-getcanonicallocales'

const resolve = (path: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)

it('loads every generated number/plural pack in Rust with its canonical locale and numbering systems', () => {
  const directory = resolve('crates/intl_numberformat/locale-data')
  const files = readdirSync(directory)
    .filter(file => file.endsWith('.json'))
    .sort()
  const packs = files.map(file =>
    readFileSync(join(directory, file), 'utf8').trim()
  )
  const result = spawnSync(
    resolve('crates/intl_numberformat/pack_conformance'),
    [],
    {
      input: packs.join('\n') + '\n',
      encoding: 'utf8',
      maxBuffer: 128 * 1024 * 1024,
    }
  )
  if (result.error) throw new Error(String(result.error) + '\n' + result.stderr)
  expect(result.status, result.stderr).toBe(0)
  const output = result.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
  expect(output).toEqual(
    packs.map(pack => {
      const raw = JSON.parse(pack) as {locale: string; data: {nu: string[]}}
      return {
        locale: getCanonicalLocales(raw.locale)[0],
        numberingSystems: raw.data.nu,
      }
    })
  )
}, 120_000)
