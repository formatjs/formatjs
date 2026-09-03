import {describe, expect, test} from 'vitest'
import {transform} from '@formatjs/unplugin/transform'
import {rule as descriptionRule} from '#packages/eslint-plugin-formatjs/rules/enforce-description.js'
import {rule as idRule} from '#packages/eslint-plugin-formatjs/rules/enforce-id.js'
import {rule as preferFormattedMessageRule} from '#packages/eslint-plugin-formatjs/rules/prefer-formatted-message.js'
import {ruleTester} from '#packages/eslint-plugin-formatjs/tests/util.js'

const descriptor = `{defaultMessage: 'Hello'}`
const wrappers = [
  (expression: string) => expression,
  (expression: string) => `(${expression})`,
  (expression: string) => `${expression} as const`,
  (expression: string) => `${expression} satisfies MessageDescriptor`,
  (expression: string) => `${expression}!`,
  (expression: string) => `<MessageDescriptor>${expression}`,
  (expression: string) =>
    `(${expression} as const satisfies MessageDescriptor)!`,
]
const formatCallees = [
  'formatMessage',
  '$formatMessage',
  '$t',
  'intl.formatMessage',
  'wrappedIntl.formatMessage',
  'this.props.wrappedIntl.formatMessage',
  'getIntl().formatMessage',
  'wrappedIntl.$formatMessage',
  'wrappedIntl.$t',
  'wrappedIntl?.formatMessage',
  'wrappedIntl.formatMessage?.',
  'wrappedIntl?.formatMessage?.',
  'customMessage',
  'helpers.customMessage',
]
const declarationCallees = ['defineMessage', 'messages.defineMessage']
const additionalFunctionNames = ['customMessage']
const settings = {formatjs: {additionalFunctionNames}}
const singleCases = [...formatCallees, ...declarationCallees].flatMap(callee =>
  wrappers.map(wrap => `${callee}(${wrap(descriptor)})`)
)
const multipleCases = ['defineMessages', 'messages.defineMessages'].flatMap(
  callee =>
    wrappers.flatMap(wrapMap =>
      wrappers.map(
        wrapDescriptor =>
          `${callee}(${wrapMap(`{hello: ${wrapDescriptor(descriptor)}}`)})`
      )
    )
)
const quotedKeyCases = [
  `wrappedIntl.formatMessage({'defaultMessage': 'Hello'})`,
  `messages.defineMessages({'hello': {'defaultMessage': 'Hello'}})`,
]
const recognizedCases = [...singleCases, ...multipleCases, ...quotedKeyCases]
const ignoredCases = [
  'unrelated({defaultMessage: "Hello"})',
  'helpers.unrelated({defaultMessage: "Hello"})',
  'wrappedIntl.formatMessage()',
  'wrappedIntl.formatMessage(message)',
  'wrappedIntl.formatMessage(message as MessageDescriptor)',
  'wrappedIntl.formatMessage(...messages)',
  'defineMessages(messages as const)',
  'defineMessages({hello: message as MessageDescriptor})',
  'defineMessages({...messages})',
  'wrappedIntl["formatMessage"]({defaultMessage: "Hello"})',
]

ruleTester.run('message recognition parity', descriptionRule, {
  valid: ignoredCases.map(code => ({code, filename: 'test.ts', settings})),
  invalid: recognizedCases.map(code => ({
    code,
    filename: 'test.ts',
    settings,
    errors: [{messageId: 'enforceDescription'}],
  })),
})

ruleTester.run('excluded message declarations', descriptionRule, {
  valid: [
    ...declarationCallees.map(callee => `${callee}(${descriptor})`),
    ...multipleCases,
  ].map(code => ({
    code,
    filename: 'test.ts',
    settings: {
      formatjs: {
        excludeMessageDeclCalls: true,
        additionalFunctionNames: ['defineMessage', 'defineMessages'],
      },
    },
  })),
  invalid: [
    {
      code: `wrappedIntl.formatMessage(${descriptor})`,
      settings: {formatjs: {excludeMessageDeclCalls: true}},
      errors: [{messageId: 'enforceDescription'}],
    },
  ],
})

ruleTester.run('descriptor wrapper autofixes', idRule, {
  valid: [],
  invalid: recognizedCases.map(code => ({
    code,
    filename: 'test.ts',
    settings,
    options: [{idInterpolationPattern: '[sha512:contenthash:base64:6]'}],
    output: code.replace("'Hello'", "'Hello', id: 'NhX4DJ'"),
    errors: [
      {
        message:
          '"id" does not match with hash pattern [sha512:contenthash:base64:6].\nExpected: NhX4DJ\nActual: {{actual}}',
      },
    ],
  })),
})

ruleTester.run(
  'prefer formatted message receiver and wrapper parity',
  preferFormattedMessageRule,
  {
    valid: [
      `<img alt={wrappedIntl.formatMessage(${descriptor} as const)} />`,
      '<div>{wrappedIntl.formatMessage(message)}</div>',
    ],
    invalid: [
      `<div>{wrappedIntl.formatMessage(${descriptor} as const)}</div>`,
      `<div>{wrappedIntl?.formatMessage(${descriptor})}</div>`,
      `<div>{wrappedIntl.formatMessage?.(${descriptor})}</div>`,
      `<div>{wrappedIntl.$formatMessage(${descriptor}!)}</div>`,
      `<div>{helpers.customMessage(${descriptor})}</div>`,
    ].map(code => ({code, settings, errors: [{messageId: 'jsxChildren'}]})),
  }
)

describe('unplugin message recognition parity', () => {
  test.each(recognizedCases)('transforms %s', code => {
    const output = transform(code, 'test.ts', {additionalFunctionNames})
    expect(output?.code).toContain('id: "NhX4DJ"')
  })

  test.each(ignoredCases)('ignores %s', code => {
    expect(
      transform(code, 'test.ts', {additionalFunctionNames})
    ).toBeUndefined()
  })
})
