import {join} from 'path'
import {Opts} from '../'
import {compile, FIXTURES_DIR} from './utils'

const FILES_TO_TESTS: Record<string, Opts> = {
  additionalComponentNames: {
    additionalComponentNames: ['CustomMessage'],
  },
  additionalFunctionNames: {
    additionalFunctionNames: ['$formatMessage'],
  },
  defineMessages: {},
  extractFromFormatMessage: {},
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
  templateLiteral: {},
  overrideIdFn: {
    overrideIdFn: (id, defaultMessage, description) => {
      return `HELLO.${id}.${defaultMessage!.length}.${typeof description}`
    },
  },
  removeDefaultMessage: {
    removeDefaultMessage: true,
  },
  noImport: {
    overrideIdFn: '[hash:base64:5]',
  },
  removeDescription: {},
  defineMessagesPreserveWhitespace: {
    pragma: 'react-intl',
    preserveWhitespace: true,
  },
}

describe.skip('emit asserts for', function () {
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
