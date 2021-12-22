import {join} from 'path'
import {FormatJSTransformer, Opts, MessageDescriptor} from '../'
import {readFile as readFileAsync} from 'fs'
import {promisify} from 'util'
import {transformSync} from '@swc/core'

const readFile = promisify(readFileAsync)

const FILES_TO_TESTS: Record<string, Partial<Opts>> = {
  additionalComponentNames: {
    additionalComponentNames: ['CustomMessage'],
    pragma: 'react-intl',
  },
  additionalFunctionNames: {
    additionalFunctionNames: ['$formatMessage'],
    pragma: 'react-intl',
  },
  defineMessages: {
    pragma: 'react-intl',
  },
  extractFromFormatMessage: {
    pragma: 'react-intl',
  },
  extractFromFormatMessageStateless: {},
  nested: {
    overrideIdFn: (id, defaultMessage, description) => {
      return `HELLO.${id}.${defaultMessage!.length}.${typeof description}`
    },
  },
  extractSourceLocation: {
    extractSourceLocation: true,
  },
  formatMessageCall: {},
  FormattedMessage: {},
  inline: {},
  stringConcat: {},
  templateLiteral: {},
  overrideIdFn: {
    overrideIdFn: (id, defaultMessage, description) => {
      return `HELLO.${id}.${defaultMessage!.length}.${typeof description}`
    },
  },
  // ast: {
  //   ast: true,
  //   overrideIdFn: (id, defaultMessage, description) => {
  //     return `HELLO.${id}.${defaultMessage!.length}.${typeof description}`
  //   },
  // },
  removeDefaultMessage: {
    removeDefaultMessage: true,
  },
  noImport: {
    overrideIdFn: '[hash:base64:5]',
  },
  resourcePath: {
    overrideIdFn: '[name]-[hash:base64:5]',
  },
  removeDescription: {},
  defineMessagesPreserveWhitespace: {
    pragma: 'react-intl',
    preserveWhitespace: true,
  },
}

const FIXTURES_DIR = join(__dirname, 'fixtures')

describe('emit asserts for', function () {
  const filenames = Object.keys(FILES_TO_TESTS)
  filenames.forEach(function (fn) {
    if (fn === 'extractSourceLocation') {
      it(`[special] ${fn}`, async function () {
        const output = await compile(
          join(FIXTURES_DIR, `${fn}.tsx`),
          FILES_TO_TESTS[fn]
        )
        // Check code output
        expect(output.code).toMatchSnapshot()
        expect(output.msgs).toHaveLength(1)
        expect(output.msgs[0]).toMatchSnapshot({
          file: expect.stringContaining('extractSourceLocation.tsx'),
        })
      })
    } else {
      it(fn, async function () {
        const output = await compile(
          join(FIXTURES_DIR, `${fn}.tsx`),
          FILES_TO_TESTS[fn]
        )
        expect(output).toMatchSnapshot()
      })
    }
  })
})

async function compile(filePath: string, options?: Partial<Opts>) {
  let msgs: MessageDescriptor[] = []
  const input = await readFile(filePath, 'utf8')
  const output = transformSync(input, {
    filename: filePath,
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
