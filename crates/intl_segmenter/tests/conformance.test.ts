import '@formatjs/intl-getcanonicallocales/polyfill-force.js'
import {Segmenter as TypeScriptSegmenter} from '@formatjs/intl-segmenter'
import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {isDeepStrictEqual} from 'node:util'
import {expect, it} from 'vitest'
import {profiles} from './profiles.js'

type Granularity = 'grapheme' | 'word' | 'sentence'
interface Part {
  segment: string
  index: number
  input: string
  isWordLike?: boolean
}
interface WirePart {
  segment: number[]
  index: number
  isWordLike?: boolean
}
interface Result {
  options: {locale: string; granularity: Granularity}
  values: {records: WirePart[]; containing: (WirePart | null)[]}[]
}
const resolve = (path: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
function units(value: string): number[] {
  return Array.from({length: value.length}, (_, index) =>
    value.charCodeAt(index)
  )
}
function wire(part: Part | undefined): WirePart | null {
  if (!part) return null
  return {
    segment: units(part.segment),
    index: part.index,
    ...(part.isWordLike === undefined ? {} : {isWordLike: part.isWordLike}),
  }
}
function run(
  requests: {
    locales: string[]
    options: {granularity: Granularity}
    inputs: number[][]
  }[]
): Result[] {
  const result = spawnSync(resolve('crates/intl_segmenter/conformance'), [], {
    input: requests.map(request => JSON.stringify(request)).join('\n') + '\n',
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  if (result.error) throw new Error(String(result.error) + '\n' + result.stderr)
  expect(result.status, result.stderr).toBe(0)
  return result.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
}

it('ports the complete Unicode 17 grapheme corpus and compares TS at every UTF-16 index', () => {
  const source = readFileSync(
    runfiles.resolve('+http_file+GraphemeBreakTest/file/downloaded'),
    'utf8'
  )
  const corpus = source.split('\n').flatMap(line => {
    const body = line.split('#')[0].trim()
    if (!body) return []
    const tokens = body.split(/\s+/)
    if (tokens.length % 2 !== 1 || tokens[tokens.length - 1] !== '÷')
      throw new Error('Malformed Unicode break test')
    const expected: string[] = []
    let text = '',
      current = ''
    for (let index = 0; index < tokens.length - 1; index += 2) {
      if (
        !['÷', '×'].includes(tokens[index]) ||
        !/^[0-9A-F]{4,6}$/.test(tokens[index + 1])
      )
        throw new Error('Malformed Unicode break token')
      if (tokens[index] === '÷' && current) {
        expected.push(current)
        current = ''
      }
      const value = String.fromCodePoint(parseInt(tokens[index + 1], 16))
      text += value
      current += value
    }
    if (current) expected.push(current)
    return [{text, expected}]
  })
  expect(corpus.length).toBeGreaterThan(700)
  const model = new TypeScriptSegmenter('en', {granularity: 'grapheme'})
  const [result] = run([
    {
      locales: ['en'],
      options: {granularity: 'grapheme'},
      inputs: corpus.map(item => units(item.text)),
    },
  ])
  expect(result.values.length).toBe(corpus.length)
  for (let index = 0; index < corpus.length; index++) {
    const item = corpus[index],
      reference = model.segment(item.text)
    expect(
      result.values[index].records.map(part => part.segment),
      String(index)
    ).toEqual(item.expected.map(units))
    expect(result.values[index].records, String(index)).toEqual(
      Array.from(reference, part => wire(part))
    )
    expect(result.values[index].containing, String(index)).toEqual(
      Array.from({length: item.text.length + 1}, (_, position) =>
        wire(reference.containing(position))
      )
    )
  }
}, 120_000)

it('compares all granularities, locale tailoring, word flags and containing results with TS', () => {
  const inputs = [
    '',
    'a',
    'abc',
    'Hello, world! 123',
    'One. Two! Three?',
    '  words  ',
    'a\r\nb',
    'a\u0301',
    '😀',
    '👩‍👩‍👧‍👦',
    '🇺🇸🇨🇦',
    '🇦\u0308🇦',
    'foo_bar',
    '3.14 + 1,234.50',
    'l’heure est arrivée.',
    '¿Qué tal? ¡Bien!',
    'Привет мир! Всё хорошо.',
    'مرحبا بالعالم.',
    'नमस्ते दुनिया।',
    'こんにちは世界',
    '你好世界',
    'ทุกสองสัปดาห์',
    'Mr. Smith went home. Next day.',
    'Dr. Jones arrived. She waved.',
    'etc.)\u2019\u00a0\u2018(the',
    'A.\r\nA',
    '\u2060c\u2060.\u2060D\u2060\u2060',
    '\u0308',
    '❤️',
    '\ud800a\udc00',
    '\0abc',
  ]
  const configurations = ['en', 'en-GB', 'fr', 'de', 'ja', 'th', 'zh'].flatMap(
    locale =>
      (['grapheme', 'word', 'sentence'] as const).map(granularity => ({
        locale,
        granularity,
      }))
  )
  const results = run(
    configurations.map(({locale, granularity}) => ({
      locales: [locale],
      options: {granularity},
      inputs: inputs.map(units),
    }))
  )
  const usedProfiles = new Set<number>()
  const mismatches: {
    locale: string
    granularity: Granularity
    input: string
    actual: unknown
    expected: unknown
  }[] = []
  for (let index = 0; index < configurations.length; index++) {
    const {locale, granularity} = configurations[index]
    const reference = new TypeScriptSegmenter(locale, {granularity})
    expect(results[index].options).toEqual(reference.resolvedOptions())
    for (let j = 0; j < inputs.length; j++) {
      const segments = reference.segment(inputs[j])
      const expected = {
        records: Array.from(segments, part => wire(part)),
        containing: Array.from({length: inputs[j].length + 1}, (_, position) =>
          wire(segments.containing(position))
        ),
      }
      const actual = results[index].values[j]
      const profileIndex = profiles.findIndex(
        profile =>
          (profile.locales as readonly string[]).includes(locale) &&
          profile.granularity === granularity &&
          profile.input === inputs[j]
      )
      if (profileIndex !== -1) {
        usedProfiles.add(profileIndex)
        const profile = profiles[profileIndex]
        function expanded(
          parts: readonly (readonly [readonly number[], ...boolean[]])[]
        ) {
          let index = 0
          const records: WirePart[] = parts.map(([segment, word]) => {
            const part: WirePart = {segment: [...segment], index}
            if (word !== undefined) part.isWordLike = word
            index += segment.length
            return part
          })
          expect(index).toBe(inputs[j].length)
          return {
            records,
            containing: Array.from(
              {length: index + 1},
              (_, position) =>
                records.find(
                  part =>
                    position >= part.index &&
                    position < part.index + part.segment.length
                ) || null
            ),
          }
        }
        expect(actual, `${locale}/${granularity}/${j}/ICU`).toEqual(
          expanded(profile.rust)
        )
        expect(expected, `${locale}/${granularity}/${j}/TS`).toEqual(
          expanded(profile.typescript)
        )
      } else if (!isDeepStrictEqual(actual, expected)) {
        const recordsDiffer = !isDeepStrictEqual(
          actual.records,
          expected.records
        )
        const position = actual.containing.findIndex(
          (part, index) => !isDeepStrictEqual(part, expected.containing[index])
        )
        mismatches.push({
          locale,
          granularity,
          input: inputs[j],
          actual: recordsDiffer
            ? actual.records
            : {position, part: actual.containing[position]},
          expected: recordsDiffer
            ? expected.records
            : {position, part: expected.containing[position]},
        })
      }
    }
  }
  expect(mismatches).toEqual([])
  expect(usedProfiles.size).toBe(profiles.length)
}, 120_000)
