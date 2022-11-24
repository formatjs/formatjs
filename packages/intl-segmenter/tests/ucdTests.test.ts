//test comment split regex ([×÷])\s(\[[0-9\.]+\])?([^×÷]+)
import {Segmenter} from '../src/segmenter'

import {readFileSync} from 'node:fs'
import * as pathUtil from 'node:path'
import {__read, __spreadArray} from 'tslib'

// //@ts-ignore
// function testDataFromLine(line: string) {
//   const [test, comment] = line.split('#')
//   const codePoints = test
//     .split(/\s*[×÷]\s*/)
//     .map(c => parseInt(c, 16))
//     .filter(c => !!c)

//   const input = String.fromCodePoint(...codePoints)

//   const expected = test
//     .split(/\s*÷\s*/)
//     .map(sequence => {
//       const codePoints = sequence
//         .split(/\s*×\s*/)
//         .map(c => parseInt(c, 16))
//         .filter(c => !!c)
//       return String.fromCodePoint(...codePoints)
//     })
//     .filter(c => !!c)

//   return {input, expected, comment}
// }
// //@ts-ignore
// const escapeCodePoints = (input: string) => {
//   const result = []
//   for (let i = 0; i < input.length; i++) {
//     result.push(input.codePointAt(i)?.toString(16))
//   }
//   return result
// }

function testDataFromLine2(line: string) {
  const [test, comment] = line.split('#')
  const trimmedTest = test.trim()
  const trimmedComment = comment.trim()

  const testMatches = __read(
    trimmedTest.matchAll(/\s?([÷×])\s?([0-9A-F]{4,})?\s?/g)
  )

  let totalmatchedLength = 0
  const testDefinition = testMatches.map(testPart => {
    totalmatchedLength += testPart[0].length
    return {
      breaks: testPart[1] === '÷',
      codePoint: testPart[2] && parseInt(testPart[2], 16),
    }
  })
  //stricter matching so future UCD updates don't accidentally pass the tests due to misparse
  if (trimmedTest.length !== totalmatchedLength) {
    throw new Error(`Error parsing test line: '${trimmedTest}'`)
  }

  const commentMatches = __read(
    trimmedComment.matchAll(/([×÷])\s(\[([0-9\.]+)\])?([^×÷]+)?/g)
  )
  totalmatchedLength = 0
  const commentDefinition = commentMatches.map(commentPart => {
    totalmatchedLength += commentPart[0].length
    return {
      breaks: commentPart[1] === '÷',
      rule: commentPart[3],
      characterName: commentPart[4]?.trim() || 'EOT',
    }
  })

  //stricter matching so future UCD updates don't accidentally pass the tests due to misparse
  if (trimmedComment.length !== totalmatchedLength) {
    throw new Error(`Error parsing comment line: '${trimmedComment}'`)
  }

  if (testDefinition.length !== commentDefinition.length) {
    throw new Error(
      `Error parsing line, mismatch length between test and comment`
    )
  }

  const testDetails = testDefinition.map((test, i) => ({
    ...test,
    ...commentDefinition[i],
  }))

  const testInput = String.fromCodePoint(
    ...testDetails
      //ignore eot entries
      .filter(({characterName}) => characterName !== 'EOT')
      .map(({codePoint}) => codePoint)
  )

  let segmentNr = 0
  const expected = Object.values(testDetails).reduce((result, testPart) => {
    if (!result.length) {
      result[0] = String.fromCodePoint(testPart.codePoint)
    } else if (testPart.codePoint) {
      if (testPart.breaks) {
        segmentNr++
        result[segmentNr] = String.fromCodePoint(testPart.codePoint)
      } else {
        result[segmentNr] += String.fromCodePoint(testPart.codePoint)
      }
    }

    return result
  }, [] as string[])

  return {testDetails, testInput, expected, comment: trimmedComment}
}

const loadUCDTestFile = (filePath: string) => {
  const testFile = readFileSync(pathUtil.resolve(__dirname, filePath), {
    encoding: 'utf8',
  })

  return (
    testFile
      //split lines
      .split(/\r?\n/)
      //filter out empty lines, and lines that start with #
      .filter(line => line.length > 0 && !/^[\s]*#/.test(line))
      //parse each line
      .map(testDataFromLine2)
  )
}

const segmentationTests = {
  grapheme: loadUCDTestFile('../unicodeFiles/GraphemeBreakTest.txt'),
  //commented out until fixed
  // sentence: loadUCDTestFile('../unicodeFiles/SentenceBreakTest.txt'),
  // word: loadUCDTestFile('../unicodeFiles/WordBreakTest.txt'),
}

describe.each(Object.entries(segmentationTests))(
  'Granularity %s',
  (granularity, ucdTests) => {
    const segmenter = new Segmenter('en', {
      granularity: granularity as keyof typeof segmentationTests,
    })
    it.each(
      ucdTests.map(test => [test.comment, test.testInput, test.expected])
    )(`Test ${granularity} %#: '%s'`, (_, testInput, expected) => {
      //@ts-ignore - to fix
      const segmentedInput = __read(segmenter.segment(testInput)).map(
        ({segment}) => segment
      )
      //@ts-ignore - to fix
      expect(segmentedInput).toEqual(expected)
    })
  }
)
