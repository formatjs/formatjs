import {Segmenter} from '#packages/intl-segmenter/segmenter.js'
import {segmentationTests} from '#packages/intl-segmenter/tests/test-utils.js'
import {describe, expect, it} from 'vitest'

const ucdTests = segmentationTests.word
describe('Granularity word', () => {
  const segmenter = new Segmenter('en', {
    granularity: 'word',
  })
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
