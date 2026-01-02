/**
 * Integration tests for ICU MessageFormat Parser WASM
 *
 * This test suite runs the same test cases as the Rust/TypeScript integration tests,
 * but using the WASM-compiled parser via the JavaScript wrapper.
 */

import {describe, test, expect} from 'vitest'
import {readFileSync, readdirSync} from 'fs'
import {join, dirname} from 'path'
import {fileURLToPath} from 'url'

// Import WASM parser
// @ts-ignore - WASM module may not have perfect types yet
import {parse as wasmParse} from '@formatjs/icu-messageformat-parser-wasm'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface ParserOptions {
  ignoreTag?: boolean
  requiresOtherClause?: boolean
  shouldParseSkeletons?: boolean
  captureLocation?: boolean
  locale?: string
}

interface TestCase {
  message: string
  options: ParserOptions
  expected: {
    val?: unknown
    err?: {
      kind?: string
      message?: string
      location?: unknown
    } | null
  }
}

/**
 * Read and parse a test case file
 */
function readTestCase(filePath: string): TestCase {
  const content = readFileSync(filePath, 'utf-8')
  const sections = content.split('\n---\n')

  if (sections.length !== 3) {
    throw new Error(
      `Test case file ${filePath} should have 3 sections separated by '\\n---\\n'`
    )
  }

  const message = sections[0]
  const options = JSON.parse(sections[1]) as ParserOptions
  const expected = JSON.parse(sections[2]) as TestCase['expected']

  return {message, options, expected}
}

/**
 * Get all test case files
 */
function getTestCaseFiles(): string[] {
  const testCasesDir = join(__dirname, 'test_cases')
  const files = readdirSync(testCasesDir)
    .filter(f => f.endsWith('.txt'))
    .sort()

  return files.map(f => join(testCasesDir, f))
}

describe('WASM Parser Integration Tests', () => {
  // No need for beforeAll - initialization is handled automatically in the package wrapper

  const testFiles = getTestCaseFiles()

  console.log(`Running ${testFiles.length} WASM integration tests`)

  for (const testFile of testFiles) {
    const testName = testFile.split('/').pop()!.replace('.txt', '')

    test(testName, async () => {
      const testCase = readTestCase(testFile)
      const {message, options, expected} = testCase

      // Check if an error was expected
      const hasError = expected.err && expected.err !== null

      if (hasError) {
        // Expect the parser to throw an error
        await expect(wasmParse(message, options)).rejects.toThrow()
      } else {
        // Parse should succeed
        const result = await wasmParse(message, options)
        expect(result).toEqual(expected.val)
      }
    })
  }

  test('should export parse function', () => {
    expect(typeof wasmParse).toBe('function')
  })
})
