import {Segmenter} from '#packages/intl-segmenter/segmenter.js'
import {segmentationTests} from '#packages/intl-segmenter/tests/test-utils.js'
import {describe, expect, it} from 'vitest'

const ucdTests = segmentationTests.word
describe('Granularity word', () => {
  const segmenter = new Segmenter('en', {
    granularity: 'word',
  })
  it.each([
    ['\u200d\udc00🇨🇦', ['\u200d', '\udc00', '🇨🇦']],
    ['\n\udc00\u0301', ['\n', '\udc00\u0301']],
    ['\ud800\u0301', ['\ud800\u0301']],
  ])('preserves word boundaries in ill-formed UTF-16 %j', (input, expected) => {
    const segments = segmenter.segment(input)
    const records = [...segments]
    expect(records.map(record => record.segment)).toEqual(expected)
    for (const record of records) {
      for (
        let index = record.index;
        index < record.index + record.segment.length;
        index++
      ) {
        expect(segments.containing(index)).toEqual(record)
      }
    }
  })

  it.each(['a\u0301', '\u0301', '😀\u0301', '🗦'])(
    'pairs regional indicators after %j',
    prefix => {
      const input = prefix + '🇺🇸🇨🇦'
      const segments = segmenter.segment(input)
      const records = Array.from(segments)
      expect(records.map(({segment}) => segment)).toEqual([prefix, '🇺🇸', '🇨🇦'])
      for (const record of records) {
        for (
          let index = record.index;
          index < record.index + record.segment.length;
          index++
        ) {
          expect(segments.containing(index)).toEqual(record)
        }
      }
    }
  )
  it.each(ucdTests.map(test => [test.comment, test.testInput, test.expected]))(
    `Test word #%#: '%s', input "%s"`,
    (_, testInput, expected) => {
      const segmentedInput = Array.from(
        segmenter.segment(testInput as string)
      ).map(result => result!.segment)
      expect(segmentedInput).toEqual(expected)
    }
  )
})
