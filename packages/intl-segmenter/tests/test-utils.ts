/**
 * Loads the 3 UCD test files: GraphemeBreakTest.txt SentenceBreakTest.txt WordBreakTest.txt
 * Parses them so they can be easily consumed by either uint tests or debug util
 */
import {readFileSync} from 'node:fs'
import * as pathUtil from 'node:path'

function testDataFromLine(line: string) {
  const [test, comment] = line.split('#')
  const trimmedTest = test.trim()
  const trimmedComment = comment.trim()

  const testMatches = Array.from(
    trimmedTest.matchAll(/\s?([÷×])\s?([0-9A-F]{4,})?\s?/g)
  )

  let totalMatchedLength = 0
  const testDefinition = testMatches.map(testPart => {
    totalMatchedLength += testPart[0].length
    return {
      breaks: testPart[1] === '÷',
      codePoint: testPart[2] && parseInt(testPart[2], 16),
    }
  })
  //stricter matching so future UCD updates don't accidentally pass the tests due to partial parsing
  if (trimmedTest.length !== totalMatchedLength) {
    throw new Error(`Error parsing test line: '${trimmedTest}'`)
  }

  const commentMatches = Array.from(
    trimmedComment.matchAll(/([×÷])\s(\[([0-9\.]+)\])?([^×÷]+)?/g)
  )
  totalMatchedLength = 0
  const commentDefinition = commentMatches.map(commentPart => {
    totalMatchedLength += commentPart[0].length
    return {
      breaks: commentPart[1] === '÷',
      rule: commentPart[3],
      characterName: commentPart[4]?.trim() || 'EOT',
    }
  })

  //stricter matching so future UCD updates don't accidentally pass the tests due to partial parsing
  if (trimmedComment.length !== totalMatchedLength) {
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
      .map(({codePoint}) => codePoint as number)
  )

  let segmentNr = 0
  const expected = Object.values(testDetails).reduce((result, testPart) => {
    if (!result.length) {
      result[0] = String.fromCodePoint(testPart.codePoint as number)
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
      .map(testDataFromLine)
  )
}

export const segmentationTests = {
  grapheme: loadUCDTestFile('../unicodeFiles/GraphemeBreakTest.txt'),
  sentence: loadUCDTestFile('../unicodeFiles/SentenceBreakTest.txt'),
  word: loadUCDTestFile('../unicodeFiles/WordBreakTest.txt'),
}
