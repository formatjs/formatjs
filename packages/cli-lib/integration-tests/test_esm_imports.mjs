#!/usr/bin/env node

/**
 * Integration test to verify ESM compatibility for issue #5569
 *
 * This test verifies that:
 * 1. The package can be imported in native ESM context
 * 2. Named imports from fs-extra/esm work correctly
 * 3. Extract and compile functions work without "Named export not found" errors
 */

import {extract, compile} from '@formatjs/cli-lib'
import {writeFile, mkdir, rm} from 'fs/promises'
import {join} from 'path'
import {fileURLToPath} from 'url'
import {dirname} from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const testDir = join(__dirname, '.test-esm-tmp')

async function setup() {
  console.log('Setting up test directory...')
  await rm(testDir, {recursive: true, force: true})
  await mkdir(testDir, {recursive: true})
}

async function cleanup() {
  console.log('Cleaning up...')
  await rm(testDir, {recursive: true, force: true})
}

async function testExtractFunction() {
  console.log('Testing extract function with ESM imports...')

  // Create a test source file
  const testSourceFile = join(testDir, 'test-source.tsx')
  const testContent = `
import {FormattedMessage} from 'react-intl'

export function TestComponent() {
  return (
    <FormattedMessage
      id="test.message"
      defaultMessage="Hello {name}"
      description="Test message"
    />
  )
}
`
  await writeFile(testSourceFile, testContent, 'utf8')

  // Test extract - this will use fs-extra/esm internally
  const result = await extract([testSourceFile], {})

  // Verify result is valid JSON
  const parsed = JSON.parse(result)

  if (!parsed['test.message']) {
    throw new Error(
      'Expected message "test.message" not found in extraction result'
    )
  }

  if (parsed['test.message'].defaultMessage !== 'Hello {name}') {
    throw new Error('Extracted message has incorrect defaultMessage')
  }

  console.log('✓ Extract function works correctly with fs-extra/esm')
}

async function testCompileFunction() {
  console.log('Testing compile function with ESM imports...')

  // Create a test messages file
  // Note: The compile function expects messages in the format produced by extract
  const testMessagesFile = join(testDir, 'messages.json')
  const messages = {
    hello: {
      defaultMessage: 'Hello World',
    },
    goodbye: {
      defaultMessage: 'Goodbye {name}',
    },
  }
  await writeFile(testMessagesFile, JSON.stringify(messages), 'utf8')

  // Test compile - this will use fs-extra/esm internally (readJSON)
  const result = await compile([testMessagesFile], {})

  // Verify result is valid JSON
  const parsed = JSON.parse(result)

  if (parsed['hello'] !== 'Hello World') {
    throw new Error('Compiled message "hello" has incorrect value')
  }

  if (parsed['goodbye'] !== 'Goodbye {name}') {
    throw new Error('Compiled message "goodbye" has incorrect value')
  }

  console.log('✓ Compile function works correctly with fs-extra/esm')
}

async function testCompileWithAST() {
  console.log('Testing compile function with AST option...')

  const testMessagesFile = join(testDir, 'messages-ast.json')
  const messages = {
    interpolated: {
      defaultMessage: 'Hello {name}, you have {count} messages',
    },
  }
  await writeFile(testMessagesFile, JSON.stringify(messages), 'utf8')

  const result = await compile([testMessagesFile], {ast: true})
  const parsed = JSON.parse(result)

  if (!Array.isArray(parsed['interpolated'])) {
    throw new Error('AST compile result should be an array')
  }

  console.log('✓ Compile function with AST works correctly')
}

async function main() {
  let exitCode = 0

  try {
    await setup()

    // Test extract function (uses outputFile from fs-extra/esm)
    await testExtractFunction()

    // Test compile function (uses readJSON from fs-extra/esm)
    await testCompileFunction()

    // Test compile with AST option
    await testCompileWithAST()

    console.log('\n✅ All ESM compatibility tests passed!')
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error.stack)
    exitCode = 1
  } finally {
    await cleanup()
  }

  process.exit(exitCode)
}

main()
