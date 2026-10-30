import {Segmenter} from '@formatjs/intl-segmenter'
import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'

it('audits TS UTF-16 boundaries and word flags against independent ICU4C/J', () => {
  const path = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/segmenter-fixtures.tsv`
  )
  const rows = readFileSync(path, 'utf8').trimEnd().split('\n').slice(1)
  expect(rows.length).toBe(1770)
  const profilePath = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/crates/intl_segmenter/tests/icu-ts-differences.tsv`
  )
  const profileRows = readFileSync(profilePath, 'utf8')
    .trimEnd()
    .split('\n')
    .slice(1)
    .map(row => row.split('\t'))
  expect(profileRows.length).toBe(42)
  const profiles = new Map(
    profileRows.map(fields => [fields.slice(0, 3).join('\t'), fields])
  )
  expect(profiles.size).toBe(42)
  const differences: string[] = []
  for (const row of rows) {
    const [locale, granularity, hex, expected] = row.split('\t')
    const units: number[] = []
    if (hex !== '_')
      for (let index = 0; index < hex.length; index += 4)
        units.push(Number.parseInt(hex.slice(index, index + 4), 16))
    const input = String.fromCharCode(...units)
    const model = new Segmenter(locale, {
      granularity: granularity as 'grapheme' | 'word' | 'sentence',
    })
    const parts = Array.from(model.segment(input))
    const actual = parts.length
      ? parts
          .map(
            part =>
              `${part.index}:${part.index + part.segment.length}:${Object.prototype.hasOwnProperty.call(part, 'isWordLike') ? (part.isWordLike ? '1' : '0') : '-'}`
          )
          .join(',')
      : '-'
    const key = [locale, granularity, hex].join('\t')
    const profile = profiles.get(key)
    if (profile) {
      expect(profile.length).toBe(6)
      expect(profile[5]).not.toBe('')
      expect(expected).toBe(profile[3])
      expect(profile[4]).not.toBe(expected)
      expect(actual).toBe(profile[4])
      profiles.delete(key)
    } else if (actual !== expected)
      differences.push(`DIFF\ttypescript\t${row}\t${actual}`)
  }
  for (const difference of differences) console.log(difference)
  expect(profiles.size).toBe(0)
  expect(differences.length).toBe(0)
})
