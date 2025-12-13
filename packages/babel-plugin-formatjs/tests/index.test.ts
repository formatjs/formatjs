import * as path from 'path'

import {transformFileSync} from '@babel/core'
import plugin from '../index.js'
import {Options, ExtractedMessageDescriptor} from '../types.js'
import {expect, test} from 'vitest'
function transformAndCheck(fn: string, opts: Options = {}) {
  const filePath = path.join(__dirname, 'fixtures', `${fn}.js`)
  const messages: ExtractedMessageDescriptor[] = []
  const meta = {}
  const {code} = transform(filePath, {
    pragma: '@react-intl',
    ...opts,
    onMsgExtracted(_, msgs) {
      messages.push(...msgs)
    },
    onMetaExtracted(_, m) {
      Object.assign(meta, m)
    },
  })
  return {
    data: {messages, meta},
    code: code?.trim(),
  }
}

test('additionalComponentNames', function () {
  transformAndCheck('additionalComponentNames', {
    additionalComponentNames: ['CustomMessage'],
  })
})

test('additionalFunctionNames', function () {
  transformAndCheck('additionalFunctionNames', {
    additionalFunctionNames: ['t'],
  })
})

test('ast', function () {
  transformAndCheck('ast', {
    ast: true,
  })
})

test('defineMessage', function () {
  transformAndCheck('defineMessage')
})

test('descriptionsAsObjects', function () {
  transformAndCheck('descriptionsAsObjects')
})

test('defineMessages', function () {
  transformAndCheck('defineMessages')
})
test('empty', function () {
  transformAndCheck('empty')
})
test('extractFromFormatMessageCall', function () {
  transformAndCheck('extractFromFormatMessageCall')
})
test('extractFromFormatMessageCallStateless', function () {
  transformAndCheck('extractFromFormatMessageCallStateless')
})
test('formatMessageCall', function () {
  transformAndCheck('formatMessageCall')
})
test('FormattedMessage', () => {
  expect(transformAndCheck('FormattedMessage')).toEqual({
    code: `import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
export default class Foo extends Component {
  render() {
    return /*#__PURE__*/React.createElement(FormattedMessage, {
      id: "foo.bar.baz",
      defaultMessage: "Hello World!"
    });
  }
}`,
    data: {
      messages: [
        {
          defaultMessage: 'Hello World!',
          description: 'The default message.',
          id: 'foo.bar.baz',
        },
      ],
      meta: {},
    },
  })
})
test('inline', function () {
  transformAndCheck('inline')
})
test('templateLiteral', function () {
  transformAndCheck('templateLiteral')
})

test('idInterpolationPattern', function () {
  transformAndCheck('idInterpolationPattern', {
    idInterpolationPattern: '[folder].[name].[sha512:contenthash:hex:6]',
  })
})

test('idInterpolationPattern default', function () {
  transformAndCheck('idInterpolationPattern')
})

test('GH #2663', function () {
  const filePath = path.join(__dirname, 'fixtures', `2663.js`)
  const messages: ExtractedMessageDescriptor[] = []
  const meta = {}

  const {code} = transformFileSync(filePath, {
    presets: ['@babel/preset-env', '@babel/preset-react'],
    plugins: [
      [
        plugin,
        {
          pragma: '@react-intl',
          onMsgExtracted(_, msgs) {
            messages.push(...msgs)
          },
          onMetaExtracted(_, m) {
            Object.assign(meta, m)
          },
        } as Options,
        Date.now() + '' + ++cacheBust,
      ],
    ],
  })!

  expect({
    data: {messages, meta},
    code: code?.trim(),
  }).toMatchSnapshot()
})

test('overrideIdFn', function () {
  transformAndCheck('overrideIdFn', {
    overrideIdFn: (
      id?: string,
      defaultMessage?: string,
      description?: string,
      filePath?: string
    ) => {
      const filename = path.basename(filePath!)
      return `${filename}.${id}.${defaultMessage!.length}.${typeof description}`
    },
  })
})
test('removeDefaultMessage', function () {
  transformAndCheck('removeDefaultMessage', {
    removeDefaultMessage: true,
  })
})
test('removeDefaultMessage + overrideIdFn', function () {
  transformAndCheck('removeDefaultMessage', {
    removeDefaultMessage: true,
    overrideIdFn: (
      id?: string,
      defaultMessage?: string,
      description?: string,
      filePath?: string
    ) => {
      const filename = path.basename(filePath!)
      return `${filename}.${id}.${defaultMessage!.length}.${typeof description}`
    },
  })
})
test('preserveWhitespace', function () {
  transformAndCheck('preserveWhitespace', {
    preserveWhitespace: true,
  })
})

test('extractSourceLocation', function () {
  const filePath = path.join(__dirname, 'fixtures', 'extractSourceLocation.js')
  const messages: ExtractedMessageDescriptor[] = []
  const meta = {}

  const {code} = transform(filePath, {
    pragma: '@react-intl',
    extractSourceLocation: true,
    onMsgExtracted(_, msgs) {
      messages.push(...msgs)
    },
    onMetaExtracted(_, m) {
      Object.assign(meta, m)
    },
  })
  expect(code?.trim()).toMatchSnapshot()
  expect(messages.map(m => m.file).filter(Boolean)).toHaveLength(1)
  expect(meta).toMatchSnapshot()
})

test('Properly throws parse errors', () => {
  expect(() =>
    transform(path.join(__dirname, 'fixtures', 'icuSyntax.js'))
  ).toThrow('SyntaxError: MALFORMED_ARGUMENT')
})

test('skipExtractionFormattedMessage', function () {
  transformAndCheck('skipExtractionFormattedMessage')
})

// See: https://github.com/formatjs/formatjs/issues/3589#issuecomment-1532461569
test('jsxNestedInCallExpr', () => {
  transformAndCheck('jsxNestedInCallExpr')
})

let cacheBust = 1

function transform(
  filePath: string,
  options: Options = {},
  {multiplePasses = false} = {}
) {
  function getPluginConfig() {
    return [plugin, options, Date.now() + '' + ++cacheBust]
  }

  return transformFileSync(filePath, {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: '14',
            esmodules: true,
          },
          modules: false,
          useBuiltIns: false,
          ignoreBrowserslistConfig: true,
        },
      ],
      '@babel/preset-react',
    ],
    plugins: multiplePasses
      ? [getPluginConfig(), getPluginConfig()]
      : [getPluginConfig()],
  })!
}

test('$t with no arguments', () => {
  expect(transformAndCheck('shorthandT')).toEqual({
    code: '$t();',
    data: {
      messages: [],
      meta: {},
    },
  })
})
