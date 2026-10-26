import '@formatjs/intl-getcanonicallocales/polyfill-force.js'
import ListFormat from '@formatjs/intl-listformat'
import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync, readdirSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {expect, it} from 'vitest'

const resolve = (path: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
function units(value: string): number[] {
  return Array.from({length: value.length}, (_, index) =>
    value.charCodeAt(index)
  )
}

it('matches every CLDR locale, type and style against the TS implementation', () => {
  const directory = dirname(
    resolve('crates/intl_listformat/locale-data/en.json')
  )
  const files = readdirSync(directory)
    .filter(file => file.endsWith('.json'))
    .sort()
  expect(files.length).toBeGreaterThan(700)
  // Ported length/pattern cases plus empty elements, non-BMP text, NUL,
  // combining marks, placeholders and lone surrogates. No input normalization.
  const lists = [
    [],
    [''],
    ['A'],
    ['A', 'B'],
    ['A', 'B', 'C'],
    ['A', 'B', 'C', 'D'],
    ['', ''],
    ['', 'B', ''],
    ['{0}', '{1}', 'literal'],
    ['😀', 'e\u0301', '東京'],
    ['\ud800', '\udc00'],
    ['\ud800\u0000', '\udc00', '😀'],
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  ]
  const records = files.flatMap(file => {
    const pack = readFileSync(join(directory, file), 'utf8')
    const {locale} = JSON.parse(pack) as {locale: string}
    const raw = JSON.parse(
      readFileSync(resolve(`packages/intl-listformat/cldr-raw/${file}`), 'utf8')
    )
    ListFormat.__addLocaleData(raw)
    return (['conjunction', 'disjunction', 'unit'] as const).flatMap(type =>
      (['long', 'short', 'narrow'] as const).map(style => ({
        pack,
        locale,
        options: {type, style},
      }))
    )
  })
  const result = spawnSync(resolve('crates/intl_listformat/conformance'), [], {
    input:
      records
        .map(record =>
          JSON.stringify({...record, lists: lists.map(list => list.map(units))})
        )
        .join('\n') + '\n',
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
  })
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  const results = result.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
  expect(results.length).toBe(records.length)
  let comparisons = 0
  for (let index = 0; index < records.length; index++) {
    const record = records[index]
    const reference = new ListFormat(record.locale, record.options)
    expect(results[index].options).toEqual(reference.resolvedOptions())
    for (let j = 0; j < lists.length; j++) {
      const list = lists[j]
      expect(
        results[index].results[j],
        `${record.locale}/${JSON.stringify(record.options)}/${j}`
      ).toEqual({
        formatted: units(reference.format(list)),
        parts: reference
          .formatToParts(list)
          .map(part => ({type: part.type, value: units(part.value)})),
      })
      comparisons++
    }
  }
  expect(comparisons).toBeGreaterThan(80_000)
}, 120_000)
