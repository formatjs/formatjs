import {Segmenter} from '../src/segmenter'
import {segmentationTests} from './test-utils'
import {describe, expect, it} from 'vitest'
const ucdTests = segmentationTests.grapheme
describe('Granularity grapheme', () => {
  const segmenter = new Segmenter('en', {
    granularity: 'grapheme',
  })
  it.each(ucdTests.map(test => [test.comment, test.testInput, test.expected]))(
    `Test grapheme #%#: '%s', input '%s'`,
    (_, testInput, expected) => {
      const segmentedInput = Array.from(
        segmenter.segment(testInput as string)
      ).map(result => result!.segment)
      expect(segmentedInput).toEqual(expected)
    }
  )
})
