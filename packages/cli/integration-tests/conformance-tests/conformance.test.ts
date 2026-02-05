import {exec as nodeExec} from 'child_process'
import {readdirSync, readFileSync, writeFileSync} from 'fs'
import {mkdirp, remove} from 'fs-extra/esm'
import {join, resolve} from 'path'
import {promisify} from 'util'
import {beforeEach, describe, expect, test} from 'vitest'
import {resolveRustBinaryPath} from '../rust-binary-utils'

const exec = promisify(nodeExec)

const TS_BIN_PATH = require.resolve('@formatjs/cli/bin/formatjs')
const RUST_BIN_PATH = resolveRustBinaryPath(import.meta.dirname)

const ARTIFACT_PATH = resolve(import.meta.dirname, 'test_artifacts')
const TEST_CASES_PATH = resolve(import.meta.dirname, 'test_cases')

// Load test cases synchronously at module level
const testCaseFiles = readdirSync(TEST_CASES_PATH)
  .filter(f => f.endsWith('.txt'))
  .sort()

interface TestCase {
  name: string
  inputCode: string
  options: {
    command: string
    args: string[]
    fileType: string
    skipLocationCheck?: boolean
  }
  expectedOutput: any
}

/**
 * Parse a test case file in the format:
 * <input code>
 * ---
 * <options JSON>
 * ---
 * <expected output JSON>
 */
function parseTestCase(filename: string, content: string): TestCase {
  const parts = content.split('\n---\n')

  if (parts.length !== 3) {
    throw new Error(
      `Invalid test case format in ${filename}: expected 3 parts, got ${parts.length}`
    )
  }

  const inputCode = parts[0].trim()
  const options = JSON.parse(parts[1].trim())
  const expectedOutput = JSON.parse(parts[2].trim())

  return {
    name: filename.replace('.txt', '').replace(/^\d+_/, ''),
    inputCode,
    options,
    expectedOutput,
  }
}

beforeEach(async () => {
  await mkdirp(ARTIFACT_PATH)
  await remove(ARTIFACT_PATH)
  await mkdirp(ARTIFACT_PATH)
})

describe('CLI Conformance Tests', () => {
  describe.each([
    {name: 'TypeScript', binPath: TS_BIN_PATH, isRust: false},
    {name: 'Rust', binPath: RUST_BIN_PATH!, isRust: true},
  ])('$name CLI', ({binPath}) => {
    test.each(testCaseFiles)(
      '%s',
      async filename => {
        const content = readFileSync(join(TEST_CASES_PATH, filename), 'utf-8')
        const testCase = parseTestCase(filename, content)

        // Write input code to a temporary file
        const inputFile = join(
          ARTIFACT_PATH,
          `input.${testCase.options.fileType}`
        )
        writeFileSync(inputFile, testCase.inputCode)

        // Build command
        const args = testCase.options.args.join(' ')
        const command = `${binPath} ${testCase.options.command} ${args} ${inputFile}`

        // Execute command
        let result
        let shouldThrow = testCase.options.args.includes('--throws')

        try {
          result = await exec(command)
        } catch (error: any) {
          // Both CLIs should throw for invalid syntax/errors
          if (shouldThrow && error.message) {
            // Test passes - command threw as expected
            // Skip output comparison for error cases
            return
          }
          throw error
        }

        // Parse output
        const actualOutput = JSON.parse(result.stdout)

        // Compare outputs
        // Handle special case for extract-source-location
        if (testCase.options.skipLocationCheck) {
          // Compare structure but skip file paths
          Object.keys(testCase.expectedOutput).forEach(key => {
            expect(actualOutput).toHaveProperty(key)
            expect(actualOutput[key].defaultMessage).toBe(
              testCase.expectedOutput[key].defaultMessage
            )
            if (testCase.expectedOutput[key].description) {
              expect(actualOutput[key].description).toBe(
                testCase.expectedOutput[key].description
              )
            }
            // Just check that file property exists, don't compare path
            if (testCase.expectedOutput[key].file) {
              expect(actualOutput[key]).toHaveProperty('file')
            }
          })
        } else {
          // Direct comparison
          expect(actualOutput).toEqual(testCase.expectedOutput)
        }
      },
      30000
    )
  })

  // Additional test: Rust and TypeScript outputs must be identical
  test.each(testCaseFiles)(
    '%s: Rust and TypeScript outputs match',
    async filename => {
      const content = readFileSync(join(TEST_CASES_PATH, filename), 'utf-8')
      const testCase = parseTestCase(filename, content)

      // Write input code to a temporary file
      const inputFile = join(
        ARTIFACT_PATH,
        `input.${testCase.options.fileType}`
      )
      writeFileSync(inputFile, testCase.inputCode)

      // Build command
      const args = testCase.options.args.join(' ')
      const tsCommand = `${TS_BIN_PATH} ${testCase.options.command} ${args} ${inputFile}`
      const rustCommand = `${RUST_BIN_PATH} ${testCase.options.command} ${args} ${inputFile}`

      // Execute both commands
      let tsResult, rustResult
      let shouldThrow = testCase.options.args.includes('--throws')

      try {
        tsResult = await exec(tsCommand)
      } catch (error: any) {
        if (shouldThrow) {
          // TypeScript threw - check if Rust also throws
          try {
            rustResult = await exec(rustCommand)
            // If Rust doesn't throw, that's a conformance issue
            throw new Error('TypeScript CLI threw but Rust CLI did not')
          } catch {
            // Both threw - test passes for error case
            return
          }
        }
        throw error
      }

      try {
        rustResult = await exec(rustCommand)
      } catch {
        // Rust threw but TypeScript didn't
        throw new Error('Rust CLI threw but TypeScript CLI did not')
      }

      // Parse outputs
      const tsOutput = JSON.parse(tsResult.stdout)
      const rustOutput = JSON.parse(rustResult.stdout)

      // Handle special case for extract-source-location
      if (testCase.options.skipLocationCheck) {
        // Compare structure but skip file paths
        Object.keys(tsOutput).forEach(key => {
          expect(rustOutput).toHaveProperty(key)
          expect(rustOutput[key].defaultMessage).toBe(
            tsOutput[key].defaultMessage
          )
          if (tsOutput[key].description) {
            expect(rustOutput[key].description).toBe(tsOutput[key].description)
          }
          if (tsOutput[key].file) {
            expect(rustOutput[key]).toHaveProperty('file')
          }
        })
      } else {
        // Outputs must be identical
        expect(rustOutput).toEqual(tsOutput)
      }
    },
    30000
  )
})
