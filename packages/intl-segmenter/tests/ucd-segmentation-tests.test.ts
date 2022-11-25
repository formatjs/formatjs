//test comment split regex ([×÷])\s(\[[0-9\.]+\])?([^×÷]+)
import {Segmenter} from '../src/segmenter'

import {__read} from 'tslib'
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
      //@ts-ignore - to fix
      const segmentedInput = __read(segmenter.segment(testInput)).map(
        ({segment}) => segment
      )
      //@ts-ignore - to fix
      expect(segmentedInput).toEqual(expected)
    })
  }
)
