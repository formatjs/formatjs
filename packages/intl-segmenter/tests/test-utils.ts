/**
 * Loads the 3 UCD test files: GraphemeBreakTest.txt SentenceBreakTest.txt WordBreakTest.txt
 * Parses them so they can be easily consumed by either uint tests or debug util
 */
import {Runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'

const runfiles = new Runfiles()

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
    trimmedComment.matchAll(/([×÷])\s(\[([0-9.]+)\])?([^×÷]+)?/g)
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

  // Filter out EOT and NULL entries (NULL is U+0000, used as test marker in Unicode 17+)
  const filteredTestDetails = testDetails.filter(
    ({characterName}) =>
      characterName !== 'EOT' && !characterName.startsWith('<NULL>')
  )

  const testInput = String.fromCodePoint(
    ...filteredTestDetails.map(({codePoint}) => codePoint as number)
  )

  let segmentNr = 0
  const expected = Object.values(filteredTestDetails).reduce(
    (result, testPart) => {
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
    },
    [] as string[]
  )

  return {testDetails, testInput, expected, comment: trimmedComment}
}

const loadUCDTestFile = (filePath: string) => {
  const testFile = readFileSync(filePath, 'utf8')

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

export const segmentationTests: {
  grapheme: {
    testDetails: {
      breaks: boolean
      rule: string
      characterName: string
      codePoint: number | ''
    }[]
    testInput: string
    expected: string[]
    comment: string
  }[]
  sentence: {
    testDetails: {
      breaks: boolean
      rule: string
      characterName: string
      codePoint: number | ''
    }[]
    testInput: string
    expected: string[]
    comment: string
  }[]
  word: {
    testDetails: {
      breaks: boolean
      rule: string
      characterName: string
      codePoint: number | ''
    }[]
    testInput: string
    expected: string[]
    comment: string
  }[]
} = {
  grapheme: loadUCDTestFile(
    runfiles.resolve('+_repo_rules2+GraphemeBreakTest/file/downloaded')
  ),
  sentence: loadUCDTestFile(
    runfiles.resolve('+_repo_rules2+SentenceBreakTest/file/downloaded')
  ),
  word: loadUCDTestFile(
    runfiles.resolve('+_repo_rules2+WordBreakTest/file/downloaded')
  ),
}
