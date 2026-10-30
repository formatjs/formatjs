import {Segmenter} from '#packages/intl-segmenter/segmenter.js'
import {segmentationTests} from '#packages/intl-segmenter/tests/test-utils.js'
import {describe, expect, it} from 'vitest'

const ucdTests = segmentationTests.sentence
describe('Granularity sentence', () => {
  const segmenter = new Segmenter('en', {
    granularity: 'sentence',
  })
  it.each(ucdTests.map(test => [test.comment, test.testInput, test.expected]))(
    `Test sentence #%#:\n'%s',\ninput '%s'`,
    (_testCase, testInput, expected) => {
      const segmentedInput = Array.from(
        segmenter.segment(testInput as string)
      ).map(result => result?.segment)
      expect(segmentedInput).toEqual(expected)
    }
  )
})

it('uses root rules for Serbian and language tailorings for regional locales', () => {
  for (const granularity of ['grapheme', 'word', 'sentence'] as const) {
    const serbian = new Segmenter('sr', {granularity, localeMatcher: 'lookup'})
    expect(serbian.resolvedOptions().locale).toBe('sr')
    const cases = {
      grapheme: ['А́😀', ['А́', '😀']],
      word: ['Здраво свете!', ['Здраво', ' ', 'свете', '!']],
      sentence: ['Здраво. Свете!', ['Здраво. ', 'Свете!']],
    } as const
    const [input, expected] = cases[granularity]
    expect([...serbian.segment(input)].map(part => part.segment)).toEqual(
      expected
    )
    const options = {granularity, localeMatcher: 'lookup'} as const
    for (const [regional, language] of [
      ['en-US', 'en'],
      ['de-DE', 'de'],
    ]) {
      const formatter = new Segmenter(regional, options)
      expect(formatter.resolvedOptions().locale).toBe(regional)
      expect([
        ...formatter.segment('Mr. Smith met Dr. Jones. Guten Tag!'),
      ]).toEqual([
        ...new Segmenter(language, options).segment(
          'Mr. Smith met Dr. Jones. Guten Tag!'
        ),
      ])
    }
  }
  expect(
    Segmenter.supportedLocalesOf(['sr', 'en-US'], {localeMatcher: 'lookup'})
  ).toEqual(['sr', 'en-US'])
})
