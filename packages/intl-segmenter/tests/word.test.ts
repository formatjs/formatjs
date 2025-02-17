import {Segmenter} from '../src/segmenter'
import {segmentationTests} from './test-utils'
import {describe, expect, it} from 'vitest'
// TODO: This seems broken in CLDRv43
const EXCLUDED_CASES_INPUTS = new Set([
  'a:a,',
  'a:̈a,',
  'a:a:',
  'a:̈a:',
  'a:a',
  'a:A',
  'A:A',
  'a:̈a',
  'a:̈A',
  'a:א',
  'a:̈א',
  "a:a'",
  "a:̈a'",
])

const EXCLUDED_CASES_COMMENTS = new Set([
  '÷ [0.2] LATIN SMALL LETTER A (ALetter) × [6.0] COLON (MidLetter) × [4.0] COMBINING DIAERESIS (Extend_FE) × [7.0] LATIN SMALL LETTER A (ALetter) ÷ [999.0] APOSTROPHE (Single_Quote) × [4.0] WORD JOINER (Format_FE) ÷ [0.3]',
  '÷ [0.2] LATIN SMALL LETTER A (ALetter) × [6.0] COLON (MidLetter) × [7.0] LATIN SMALL LETTER A (ALetter) ÷ [999.0] APOSTROPHE (Single_Quote) × [4.0] WORD JOINER (Format_FE) ÷ [0.3]',
  '÷ [0.2] LATIN SMALL LETTER A (ALetter) × [6.0] COLON (MidLetter) × [4.0] COMBINING DIAERESIS (Extend_FE) × [7.0] LATIN SMALL LETTER A (ALetter) × [4.0] WORD JOINER (Format_FE) ÷ [0.3]',
  '÷ [0.2] LATIN SMALL LETTER A (ALetter) × [6.0] COLON (MidLetter) × [7.0] LATIN SMALL LETTER A (ALetter) × [4.0] WORD JOINER (Format_FE) ÷ [0.3]',
])

const ucdTests = segmentationTests.word.filter(
  test =>
    !EXCLUDED_CASES_INPUTS.has(test.testInput) &&
    !EXCLUDED_CASES_COMMENTS.has(test.comment)
)
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
