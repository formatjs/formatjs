import {Segmenter as TypeScriptSegmenter} from '@formatjs/intl-segmenter'
const rows = (globalThis as any).__SEGMENTER_FIXTURES as string[][]
const profileRows = (globalThis as any).__SEGMENTER_TS_DIFFERENCES as string[][]
const profiles = new Map(
  profileRows.map(fields => [fields.slice(0, 3).join('\t'), fields])
)
let assertions = 0
let cases = 0
function check(value: unknown, message: string): void {
  assertions++
  if (!value) throw new Error(message)
}
function encode(part: any): string {
  return `${part.index}:${part.index + part.segment.length}:${Object.prototype.hasOwnProperty.call(part, 'isWordLike') ? (part.isWordLike ? '1' : '0') : '-'}`
}
check(rows.length === 1770, 'complete independent ICU matrix')
check(
  profiles.size === 42 && profileRows.length === 42,
  'exact TS boundary profiles'
)
for (const [implementation, Model] of [
  ['native', Intl.Segmenter],
  ['typescript', TypeScriptSegmenter],
] as const) {
  for (const [locale, granularity, hex, oracle] of rows) {
    const units: number[] = []
    if (hex !== '_')
      for (let index = 0; index < hex.length; index += 4)
        units.push(Number.parseInt(hex.slice(index, index + 4), 16))
    const input = String.fromCharCode(...units)
    const key = [locale, granularity, hex].join('\t')
    const profile =
      implementation === 'typescript' ? profiles.get(key) : undefined
    if (profile) {
      check(
        profile.length === 6 && profile[5].length > 0,
        'documented TS boundary profile'
      )
      check(
        profile[3] === oracle && profile[4] !== oracle,
        'profile matches independent ICU output'
      )
      profiles.delete(key)
    }
    const expected = profile ? profile[4] : oracle
    const model = new Model(locale, {
      granularity: granularity as 'grapheme' | 'word' | 'sentence',
    })
    const segments = model.segment(input)
    const parts = Array.from(segments)
    check(
      (parts.length ? parts.map(encode).join(',') : '-') === expected,
      `${implementation} ${locale} ${granularity} ${hex}: ICU boundaries/status`
    )
    for (const part of parts) {
      check(part.input === input, 'original UTF-16 input')
      check(
        Object.getPrototypeOf(part) === Object.prototype,
        'ordinary segment record'
      )
      const keys = ['segment', 'index', 'input']
      if (granularity === 'word') keys.push('isWordLike')
      check(
        JSON.stringify(Object.keys(part)) === JSON.stringify(keys),
        'record key order'
      )
      for (const key of keys) {
        const descriptor = Object.getOwnPropertyDescriptor(part, key)!
        check(
          descriptor.writable &&
            descriptor.enumerable &&
            descriptor.configurable,
          'data property attributes'
        )
      }
    }
    const ranges =
      expected === '-'
        ? []
        : expected.split(',').map(record => record.split(':'))
    for (let index = 0; index < input.length; index++) {
      const expectedRange = ranges.find(
        ([start, end]) => +start <= index && index < +end
      )!
      const actual = segments.containing(index)!
      check(
        encode(actual) === expectedRange.join(':'),
        'containing uses oracle UTF-16 boundaries'
      )
      check(
        actual.segment === input.slice(+expectedRange[0], +expectedRange[1]),
        'exact UTF-16 segment'
      )
      check(actual.input === input, 'containing retains original input')
      check(
        actual !== segments.containing(index),
        'containing returns fresh records'
      )
    }
    check(
      segments.containing(-1) === undefined &&
        segments.containing(input.length) === undefined,
      'containing bounds'
    )
    cases++
  }
}
check(profiles.size === 0, 'all TS boundary profiles exercised')
;(globalThis as any).print(
  JSON.stringify({type: 'Segmenter-ICU-conformance', cases, assertions})
)
