import * as path from 'path'
import {/* ExtractedMessageDescriptor, */ transform, Options} from './transform'

export function transformAndCheck(
  fn: string,
  opts: Options = {},
  transformOptions?: any
) {
  const filePath = path.join(__dirname, 'fixtures', `${fn}.js`)
  const {code} = transform(filePath, transformOptions, {
    pragma: '@react-intl',
    ...opts,
  })

  const [ret, comments] = code.split('/*__formatjs__messages_extracted__::')
  const data = JSON.parse(comments.substring(0, comments.indexOf('*/')))

  return {
    data,
    code: ret?.trim(),
  }
}

test('additionalComponentNames', function () {
  expect(
    transformAndCheck('additionalComponentNames', {
      additionalComponentNames: ['CustomMessage'],
    })
  ).toMatchSnapshot()
})

test('additionalFunctionNames', function () {
  expect(
    transformAndCheck('additionalFunctionNames', {
      additionalFunctionNames: ['t'],
    })
  ).toMatchSnapshot()
})

test('ast', function () {
  expect(
    transformAndCheck('ast', {
      ast: true,
    })
  ).toMatchSnapshot()
})

test('defineMessage', function () {
  expect(transformAndCheck('defineMessage')).toMatchSnapshot()
})

test('descriptionsAsObjects', function () {
  expect(transformAndCheck('descriptionsAsObjects')).toMatchSnapshot()
})

test('defineMessages', function () {
  expect(transformAndCheck('defineMessages')).toMatchSnapshot()
})
test('empty', function () {
  expect(transformAndCheck('empty')).toMatchSnapshot()
})
test('extractFromFormatMessageCall', function () {
  expect(transformAndCheck('extractFromFormatMessageCall')).toMatchSnapshot()
})
test('extractFromFormatMessageCallStateless', function () {
  expect(
    transformAndCheck('extractFromFormatMessageCallStateless')
  ).toMatchSnapshot()
})
test('formatMessageCall', function () {
  expect(transformAndCheck('formatMessageCall')).toMatchSnapshot()
})
test('FormattedMessage', function () {
  expect(transformAndCheck('FormattedMessage')).toMatchSnapshot()
})
test('inline', function () {
  expect(transformAndCheck('inline')).toMatchSnapshot()
})
test('templateLiteral', function () {
  expect(transformAndCheck('templateLiteral')).toMatchSnapshot()
})

// NOT FULLY IMPLEMENTED
test.skip('idInterpolationPattern', function () {
  expect(
    transformAndCheck('idInterpolationPattern', {
      idInterpolationPattern: '[folder].[name].[sha512:contenthash:hex:6]',
    })
  ).toMatchSnapshot()
})

test('idInterpolationPattern default', function () {
  expect(transformAndCheck('idInterpolationPattern')).toMatchSnapshot()
})

test('GH #2663', function () {
  expect(
    transformAndCheck('2663', undefined, {
      jsc: {
        target: 'es5',
      },
    })
  ).toMatchSnapshot()
})

// UNSUPPORTED
test.skip('overrideIdFn', function () {
  expect(
    transformAndCheck('overrideIdFn', {
      overrideIdFn: (
        id?: string,
        defaultMessage?: string,
        description?: string,
        filePath?: string
      ) => {
        const filename = path.basename(filePath!)
        return `${filename}.${id}.${
          defaultMessage!.length
        }.${typeof description}`
      },
    })
  ).toMatchSnapshot()
})

test('removeDefaultMessage', function () {
  expect(
    transformAndCheck('removeDefaultMessage', {
      removeDefaultMessage: true,
    })
  ).toMatchSnapshot()
})

// UNSUPPORTED
test.skip('removeDefaultMessage + overrideIdFn', function () {
  expect(
    transformAndCheck('removeDefaultMessage', {
      removeDefaultMessage: true,
      overrideIdFn: (
        id?: string,
        defaultMessage?: string,
        description?: string,
        filePath?: string
      ) => {
        const filename = path.basename(filePath!)
        return `${filename}.${id}.${
          defaultMessage!.length
        }.${typeof description}`
      },
    })
  ).toMatchSnapshot()
})
test('preserveWhitespace', function () {
  expect(
    transformAndCheck('preserveWhitespace', {
      preserveWhitespace: true,
    })
  ).toMatchSnapshot()
})

test('extractSourceLocation', function () {
  const {data, code} = transformAndCheck('extractSourceLocation', {
    extractSourceLocation: true,
  })

  expect(code).toMatchSnapshot()

  expect(data).toEqual({
    messages: [
      {
        defaultMessage: 'Hello World!',
        id: 'foo.bar.baz',
        loc: {
          end: {
            col: 78,
            line: 6,
          },
          file: path.join(__dirname, 'fixtures/extractSourceLocation.js'),
          start: {
            col: 11,
            line: 6,
          },
        },
      },
    ],
    meta: {},
  })
})

test('Properly throws parse errors', () => {
  expect(() => transformAndCheck('icuSyntax')).toThrow(
    'SyntaxError: MALFORMED_ARGUMENT'
  )
})

test('skipExtractionFormattedMessage', function () {
  expect(transformAndCheck('skipExtractionFormattedMessage')).toMatchSnapshot()
})
