import {readFile as readFileAsync} from 'fs'
import {transform} from '@swc/core'
import FormatJSTransformer, {MessageDescriptor, Opts} from '..'
import {promisify} from 'util'
import {join} from 'path'
const readFile = promisify(readFileAsync)

export const FIXTURES_DIR = join(__dirname, 'fixtures')

export async function compile(filePath: string, options?: Opts) {
  let msgs: MessageDescriptor[] = []
  const input = await readFile(filePath, 'utf8')
  const output = await transform(input, {
    filename: filePath,
    // Prevent the root `.swcrc` from affecting the transform result.
    root: __dirname,
    jsc: {
      parser: {
        syntax: 'typescript',
        tsx: true,
        decorators: true,
        dynamicImport: true,
      },
    },
    plugin: m =>
      new FormatJSTransformer({
        filename: filePath,
        overrideIdFn: '[hash:base64:10]',
        onMsgExtracted: (_, extractedMsgs) => {
          msgs = msgs.concat(extractedMsgs)
        },
        ...(options || {}),
      }).visitProgram(m),
  })
  return {
    msgs,
    code: output.code,
  }
}
