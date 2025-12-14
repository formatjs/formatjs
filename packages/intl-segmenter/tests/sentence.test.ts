import {Segmenter} from '../src/segmenter.js'
import {segmentationTests} from './test-utils.js'
import {describe, expect, it} from 'vitest'
// TODO: Fix this
const excluded = [
  '÷ [0.2] LATIN CAPITAL LETTER A (Upper) × [998.0] FULL STOP (ATerm) × [9.0] <CARRIAGE RETURN (CR)> (CR) × [3.0] <LINE FEED (LF)> (LF) ÷ [4.0] LATIN CAPITAL LETTER A (Upper) ÷ [0.3]',
]

const ucdTests = segmentationTests.sentence
describe('Granularity sentence', () => {
  const segmenter = new Segmenter('en', {
    granularity: 'sentence',
  })
  it.each(ucdTests.map(test => [test.comment, test.testInput, test.expected]))(
    `Test sentence #%#:\n'%s',\ninput '%s'`,
    (testCase, testInput, expected) => {
      if (excluded.includes(testCase)) {
        return
      }
      const segmentedInput = Array.from(
        segmenter.segment(testInput as string)
      ).map(result => result?.segment)
      expect(segmentedInput).toEqual(expected)
    }
  )
})
