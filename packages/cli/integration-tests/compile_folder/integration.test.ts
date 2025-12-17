import {exec as nodeExec} from 'child_process'
import {sync as globSync} from 'fast-glob'
import {mkdtempSync} from 'fs'
import {readJSON} from 'fs-extra/esm'
import {basename, join} from 'path'
import {expect, test} from 'vitest'
import {promisify} from 'util'
const exec = promisify(nodeExec)
const BIN_PATH = require.resolve('@formatjs/cli/bin/formatjs')

test('basic case: help', async () => {
  await expect(exec(`${BIN_PATH} compile-folder --help`)).resolves.toEqual({
    stderr: '',
    stdout: `Usage: formatjs compile-folder [options] <folder> <outFolder>

Batch compile all extracted translation JSON files in <folder> to <outFolder>
containing react-intl consumable JSON. We also verify that the messages are
valid ICU and not malformed.

Options:
  --format <path>  Path to a formatter file that converts JSON files in \`<folder>\` to \`Record<string, string>\` so we can compile. The file must export a function named \`compile\` with the signature:
  \`\`\`
  type CompileFn = <T = Record<string, MessageDescriptor>>(
    msgs: T
  ) => Record<string, string>;
  \`\`\`
  This is especially useful to convert from a TMS-specific format back to react-intl format
  
  --ast            Whether to compile to AST. See
                   https://formatjs.github.io/docs/guides/advanced-usage#pre-parsing-messages
                   for more information
  -h, --help       display help for command
`,
  })
}, 20000)

test('basic case', async () => {
  const inputFiles = globSync(`${__dirname}/lang/*.json`)
  const outFolder = mkdtempSync('formatjs-cli')
  await exec(
    `${BIN_PATH} compile-folder ${join(__dirname, 'lang')} ${outFolder}`
  )

  const outputFiles = globSync(`${outFolder}/*.json`)
  expect(outputFiles.map(f => basename(f))).toEqual(
    inputFiles.map(f => basename(f))
  )

  await expect(Promise.all(outputFiles.map(f => readJSON(f)))).resolves.toEqual(
    [
      {},
      {
        a1d12: 'I have {count, plural, one{a dog} other{many dogs}}',
        a1dd2: 'my name is {name}',
        ashd2: 'a message',
      },
      {
        '1': 'another message',
        '2': 'my name is {foo}',
        '3': 'I have {count, plural, one{a cat} other{many cats}}',
      },
    ]
  )
}, 20000)
