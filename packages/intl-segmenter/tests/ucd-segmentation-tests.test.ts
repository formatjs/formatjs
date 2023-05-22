import {Segmenter} from '../src/segmenter'
import {segmentationTests} from './test-utils'

describe.each(Object.entries(segmentationTests))(
  'Granularity %s',
  (granularity, ucdTests) => {
    const segmenter = new Segmenter('en', {
      granularity: granularity as keyof typeof segmentationTests,
    })
    it.each(
      ucdTests.map(test => [test.comment, test.testInput, test.expected])
    )(`Test ${granularity} #%#: '%s'`, (_, testInput, expected) => {
      const segmentedInput = Array.from(
        segmenter.segment(testInput as string)
      ).map(result => result!.segment)
      expect(segmentedInput).toEqual(expected)
    })
  }
)
