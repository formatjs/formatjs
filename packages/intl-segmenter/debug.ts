// @ts-nocheck
/**
 * To debug failing UCD tests
 * `npx ts-node debug <word|sentence|grapheme> [testRange]`
 * example: `npx ts-node debug word 1700-1701`
 */

import {Segmenter} from './src/segmenter'
import {segmentationTests} from './tests/test-utils'

//parse argvs
const lastArg = process.argv[process.argv.length - 1]
const beforeLastArg = process.argv[process.argv.length - 2]

const isValidGranularity = i => ['word', 'sentence', 'grapheme'].includes(i)
let granularity = 'grapheme'
let range = undefined
if (isValidGranularity(lastArg)) {
  granularity = lastArg
} else if (isValidGranularity(beforeLastArg)) {
  granularity = beforeLastArg
  range = lastArg.split('-')
} else {
  console.log('Invalid args: debug.ts word|sentence|grapheme [#-#]')
  process.exit(1)
}

let failingRules = new Set()
const debugRun = (
  granularity: keyof typeof segmentationTests,
  testRange?: undefined | number[]
) => {
  let failedTestsNr = 0
  let successTestNr = 0
  const segmenter = new Segmenter(undefined, {granularity})

  const testSubset = testRange
    ? testRange.length === 1
      ? [segmentationTests[granularity][testRange]]
      : segmentationTests[granularity].slice(...testRange)
    : segmentationTests[granularity]

  let testNr = testRange ? testRange[0] : 0
  for (const test of testSubset) {
    let correctSplit = true
    let breaksAtResults = []
    let actualSegments = []
    let segmentIndex = 0
    for (let position = 0; position <= test.testInput.length; position++) {
      const {breaks, matchingRule} = segmenter.breaksAt(
        position,
        test.testInput
      )
      //0.1 is surrogate and we need to artificially insert the non-breakpoint into the test details
      if (matchingRule === '0.1') {
        test.testDetails.splice(position, 0, {
          breaks: false,
          rule: '0.1',
          characterName: 'Leading surrogate',
          codePoint: test.testInput[position].charAt(0),
        })
      }
      breaksAtResults[position] = {breaks, matchingRule}

      if (breaks && position !== 0 && position !== test.testInput.length) {
        segmentIndex++
        actualSegments[segmentIndex] = ''
      }
      actualSegments[segmentIndex] =
        (actualSegments[segmentIndex] || '') + (test.testInput[position] || '')

      //there is a mismatch here
      if (breaks !== test.testDetails[position].breaks) {
        correctSplit = false
      }
      if (
        matchingRule !== test.testDetails[position].rule &&
        matchingRule + '.0' !== test.testDetails[position].rule
      ) {
        failingRules.add(test.testDetails[position].rule)
      }
    }

    if (!correctSplit) {
      failedTestsNr++

      const table = breaksAtResults.map((result, i) => ({
        correct: result.breaks === test.testDetails[i].breaks ? '✅' : '❌',
        breaks: result.breaks ? '÷' : '×',
        matchingRule: result.matchingRule,
        expectedBreak: test.testDetails[i].breaks ? '÷' : '×',
        expectedRule: test.testDetails[i].rule,
      }))
      console.log(`Test #${testNr} failed`)
      console.log(test.comment)

      console.log(
        'input: ',
        JSON.stringify(test.testInput),
        'actual :',
        actualSegments,
        'expected: ',
        test.expected
      )
      console.table(table)
    } else {
      successTestNr++
    }
    testNr++
  }
  console.log(
    `Test success: ${
      successTestNr + failedTestsNr
    } Tests failed: ${failedTestsNr} Tests Total: ${successTestNr}`
  )
}
debugRun(granularity, range)
const failingRulesArray = Array.from(failingRules.values())
if (failingRulesArray.length) {
  console.log(
    `Mismatching rules: ${Array.from(failingRules.values()).join(', ')}`
  )
}
