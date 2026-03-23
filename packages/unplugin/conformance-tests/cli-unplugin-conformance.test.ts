/**
 * Conformance tests: formatjs_cli extract vs @formatjs/unplugin transform
 *
 * Verifies that the unplugin (with its default options: flatten=true,
 * idInterpolationPattern='[sha512:contenthash:base64:6]') generates the same
 * message IDs as `formatjs_cli extract --flatten`.
 *
 * This ensures that messages extracted at build time by the CLI and messages
 * transformed at bundle time by the Vite/Rollup/esbuild plugin share identical
 * IDs, preventing mismatches in production.
 */
import {exec as nodeExec} from 'child_process'
import {mkdirSync, rmSync, writeFileSync} from 'fs'
import {join, resolve} from 'path'
import {promisify} from 'util'
import {afterAll, beforeAll, describe, expect, test} from 'vitest'
import {transform} from '../transform.js'
import {resolveRustBinaryPath} from './rust-binary-utils.js'

const exec = promisify(nodeExec)

const RUST_BIN_PATH = resolveRustBinaryPath(import.meta.dirname)
const ARTIFACT_PATH = resolve(import.meta.dirname, 'test_artifacts')

/**
 * Extract IDs that the unplugin inserted into the transformed code.
 * Handles both JS form (id: "value") and JSX attribute form (id="value").
 */
function extractPluginIds(code: string): string[] {
  const ids: string[] = []
  for (const match of code.matchAll(/\bid(?::\s*|=)"([^"]+)"/g)) {
    ids.push(match[1])
  }
  return ids.sort()
}

describe(
  'formatjs_cli vs @formatjs/unplugin conformance',
  () => {
    if (!RUST_BIN_PATH) {
      test.skip('Rust CLI not available — skipping conformance tests', () => {})
      return
    }

    beforeAll(() => {
      mkdirSync(ARTIFACT_PATH, {recursive: true})
    })

    afterAll(() => {
      rmSync(ARTIFACT_PATH, {recursive: true, force: true})
    })

    /**
     * Assert that `formatjs_cli extract --flatten` and the unplugin transform
     * (default options: flatten=true) produce identical IDs for the given code.
     */
    async function assertConformance(code: string, filename: string) {
      const tempFile = join(ARTIFACT_PATH, filename)
      writeFileSync(tempFile, code)

      // CLI: --flatten matches the plugin's default flatten=true
      const {stdout} = await exec(
        `"${RUST_BIN_PATH}" extract --flatten "${tempFile}"`
      )
      const cliOutput: Record<string, {defaultMessage: string}> =
        JSON.parse(stdout)
      const cliIds = Object.keys(cliOutput).sort()

      // Plugin: default options (flatten=true, idInterpolationPattern=[sha512:contenthash:base64:6])
      const result = transform(code, tempFile, {})
      expect(result, 'unplugin should transform the code').toBeDefined()
      const pluginIds = extractPluginIds(result!.code)

      expect(pluginIds).toEqual(cliIds)
    }

    test('plain formatMessage without description', async () => {
      await assertConformance(
        `intl.formatMessage({defaultMessage: 'Hello World'})`,
        'plain-no-desc.tsx'
      )
    })

    test('plain formatMessage with description', async () => {
      await assertConformance(
        `intl.formatMessage({defaultMessage: 'Hello World', description: 'greeting'})`,
        'plain-with-desc.tsx'
      )
    })

    test('plural message — flatten hoists selectors', async () => {
      await assertConformance(
        `intl.formatMessage({defaultMessage: '{count, plural, one {# item} other {# items}}'})`,
        'plural.tsx'
      )
    })

    test('plural embedded in sentence — flatten produces full phrases', async () => {
      await assertConformance(
        `<FormattedMessage defaultMessage="Are you sure you want to delete {count,plural,one {this template} other {these # templates}}?" />`,
        'plural-sentence.tsx'
      )
    })

    test('JSX FormattedMessage with description', async () => {
      await assertConformance(
        `<FormattedMessage defaultMessage="Hello World" description="greeting" />`,
        'jsx-with-desc.tsx'
      )
    })

    test('defineMessages with multiple messages', async () => {
      await assertConformance(
        `defineMessages({
  greeting: {defaultMessage: 'Hello', description: 'greeting'},
  farewell: {defaultMessage: 'Goodbye', description: 'farewell'},
})`,
        'define-messages.tsx'
      )
    })

    test('whitespace is normalized before ID generation', async () => {
      await assertConformance(
        `intl.formatMessage({defaultMessage: '  Hello   World  '})`,
        'whitespace.tsx'
      )
    })
  },
  30000
)
