import {Segmenter} from '../src/segmenter'
import {segmentationTests} from './test-utils'

const ucdTests = segmentationTests.sentence
describe('Granularity sentence', () => {
  const segmenter = new Segmenter('en', {
    granularity: 'sentence',
  })
  it.each(ucdTests.map(test => [test.comment, test.testInput, test.expected]))(
    `Test sentence #%#: '%s', input '%s'`,
    (_, testInput, expected) => {
      const segmentedInput = Array.from(
        segmenter.segment(testInput as string)
      ).map(result => result!.segment)
      expect(segmentedInput).toEqual(expected)
    }
  )
})
