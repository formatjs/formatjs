import {transformSync} from '@babel/core'
import {describe, expect, test} from 'vitest'
import plugin from '#packages/babel-plugin-formatjs/index.js'
import type {
  MessageDescriptor,
  Options,
} from '#packages/babel-plugin-formatjs/types.js'

const wrappers = [
  {name: 'literal', wrap: (value: string) => value},
  {name: 'parentheses', wrap: (value: string) => `(${value})`},
  {name: 'as', wrap: (value: string) => `${value} as const`},
  {name: 'satisfies', wrap: (value: string) => `${value} satisfies Message`},
  {name: 'non-null', wrap: (value: string) => `${value}!`},
  {name: 'type assertion', wrap: (value: string) => `<Message>${value}`},
  {
    name: 'nested',
    wrap: (value: string) => `(${value} as const satisfies Message)!`,
  },
]

function transform(code: string, options: Options = {}, jsx = false) {
  const messages: MessageDescriptor[] = []
  const result = transformSync(code, {
    filename: jsx ? 'messages.tsx' : 'messages.ts',
    configFile: false,
    babelrc: false,
    parserOpts: {
      plugins: jsx ? ['typescript', 'jsx'] : ['typescript'],
      createParenthesizedExpressions: true,
    },
    plugins: [
      [
        plugin,
        {
          ...options,
          onMsgExtracted: (_: string, extracted: MessageDescriptor[]) =>
            messages.push(...extracted),
        },
      ],
    ],
  })!
  return {code: result.code!, messages}
}

const expected = {
  id: 'MJezg/',
  defaultMessage: 'Hello',
  description: 'Greeting',
}

describe.each(wrappers)('$name', ({name, wrap}) => {
  test.each(['id', 'defaultMessage', 'description'])(
    'evaluates wrapped %s',
    property => {
      const values: Record<string, string> = {
        id: '"explicit"',
        defaultMessage: '`Hello`',
        description: '"Greeting"',
      }
      values[property] = wrap(values[property])
      const descriptor = `{${Object.entries(values)
        .map(([key, value]) => `${key}: ${value}`)
        .join(',')}}`
      expect(transform(`intl.formatMessage(${descriptor})`).messages).toEqual([
        {...expected, id: 'explicit'},
      ])
    }
  )

  test.each([
    'formatMessage',
    'intl.formatMessage',
    'intl?.formatMessage?.',
    'defineMessage',
    'customMessage',
  ])('extracts wrapped %s descriptor', callee => {
    const {messages, code} = transform(
      `${callee}(${wrap('{defaultMessage: "Hello", description: "Greeting"}')})`,
      {additionalFunctionNames: ['customMessage']}
    )
    expect(messages).toEqual([expected])
    expect(code).toContain('id: "MJezg/"')
    expect(code).not.toContain('description:')
  })

  for (const entry of wrappers) {
    test(`extracts map with ${entry.name} entry`, () => {
      const descriptor = entry.wrap(
        '{defaultMessage: "Hello", description: "Greeting"}'
      )
      expect(
        transform(`defineMessages(${wrap(`{hello: ${descriptor}}`)})`).messages
      ).toEqual([expected])
    })
  }

  if (name !== 'type assertion') {
    test('extracts wrapped JSX attributes', () => {
      const result = transform(
        `<FormattedMessage id={${wrap('"explicit"')}} defaultMessage={${wrap('`Hello`')}} description={${wrap('"Greeting"')}} />`,
        {},
        true
      )
      expect(result.messages).toEqual([{...expected, id: 'explicit'}])
      expect(result.code).not.toContain('description=')
    })
  }
})

test('preserves wrappers when rewriting strings and descriptors', () => {
  const result = transform(
    'defineMessage(({id: "old" satisfies string, defaultMessage: " Hello " as const} satisfies Message)!)',
    {overrideIdFn: () => 'new'}
  )
  expect(result.code).toContain('"new" satisfies string')
  expect(result.code).toContain('"Hello" as const')
  expect(result.code).toContain('satisfies Message)!')
  expect(result.messages).toEqual([{id: 'new', defaultMessage: 'Hello'}])
})

test('preserves JSX ID wrappers when overriding IDs', () => {
  const result = transform(
    '<FormattedMessage id={"old" satisfies string} defaultMessage={"Hello" as const} />',
    {overrideIdFn: () => 'new'},
    true
  )
  expect(result.code).toContain('id={"new" satisfies string}')
  expect(result.code).toContain('defaultMessage={"Hello" as const}')
})

test.each([false, true])('compiles wrapped messages to AST (JSX=%s)', jsx => {
  const source = jsx
    ? '<FormattedMessage defaultMessage={"Hello" satisfies string} />'
    : 'defineMessage({defaultMessage: "Hello" satisfies string} as const)'
  const result = transform(source, {ast: true}, jsx)
  expect(result.messages).toEqual([{id: 'NhX4DJ', defaultMessage: 'Hello'}])
  expect(result.code).toContain('"value": "Hello"')
  expect(result.code).not.toContain('satisfies string')
  expect(() => transform(result.code, {ast: true}, jsx)).not.toThrow()
})

test.each([false, true])('removes wrapped defaultMessage (JSX=%s)', jsx => {
  const source = jsx
    ? '<FormattedMessage defaultMessage={"Hello" satisfies string} description={"Greeting" as const} />'
    : 'defineMessage({defaultMessage: "Hello" satisfies string, description: "Greeting" as const} satisfies Message)'
  const result = transform(source, {removeDefaultMessage: true}, jsx)
  expect(result.messages).toEqual([expected])
  expect(result.code).not.toContain('defaultMessage')
  expect(result.code).not.toContain('description')
  expect(result.code).toContain('MJezg/')
})

test('keeps dynamic values unevaluable, including throws=false', () => {
  const source =
    'defineMessage({defaultMessage: getMessage() satisfies string})'
  expect(() => transform(source)).toThrow(
    'Messages must be statically evaluate-able for extraction.'
  )
  const errors: Error[] = []
  const result = transform(source, {
    throws: false,
    onMsgError: (_, error) => errors.push(error),
  })
  expect(result.messages).toEqual([])
  expect(result.code).toContain('getMessage() satisfies string')
  expect(errors).toHaveLength(1)
})

test('skips wrapped dynamic descriptors in formatMessage', () => {
  expect(
    transform('intl.formatMessage(descriptor satisfies Message)').messages
  ).toEqual([])
})

test('skips wrapped precompiled descriptors', () => {
  const result = transform(
    'defineMessage({defaultMessage: [{type: 0, value: "Hello"}] as const})',
    {ast: true}
  )
  expect(result.messages).toEqual([])
  expect(result.code).toContain('as const')
})

test.each(['defineMessage()', 'defineMessages(dynamic satisfies Messages)'])(
  'reports descriptor errors for %s',
  source => {
    expect(() => transform(source)).toThrow(
      'must be called with an object expression'
    )
  }
)

test('retains Flow cast support', () => {
  const messages: MessageDescriptor[] = []
  transformSync(
    'defineMessages(({hello: ({defaultMessage: ("Hello": string)}: Message)}: Messages))',
    {
      configFile: false,
      babelrc: false,
      parserOpts: {plugins: ['flow']},
      plugins: [
        [
          plugin,
          {
            onMsgExtracted: (_: string, extracted: MessageDescriptor[]) =>
              messages.push(...extracted),
          },
        ],
      ],
    }
  )
  expect(messages).toEqual([{id: 'NhX4DJ', defaultMessage: 'Hello'}])
})

test('extracts JSX satisfies with default parser parentheses handling', () => {
  const messages: MessageDescriptor[] = []
  transformSync(
    '<FormattedMessage defaultMessage={`Hello` satisfies string} />',
    {
      configFile: false,
      babelrc: false,
      parserOpts: {plugins: ['typescript', 'jsx']},
      plugins: [
        [
          plugin,
          {
            onMsgExtracted: (_: string, extracted: MessageDescriptor[]) =>
              messages.push(...extracted),
          },
        ],
      ],
    }
  )
  expect(messages).toEqual([{id: 'NhX4DJ', defaultMessage: 'Hello'}])
})

test('keeps source locations on wrapped descriptors', () => {
  const result = transform(
    'defineMessage(({defaultMessage: "Hello"} satisfies Message)!)',
    {extractSourceLocation: true}
  )
  expect(result.messages).toEqual([
    expect.objectContaining({
      id: 'NhX4DJ',
      defaultMessage: 'Hello',
      start: expect.objectContaining({line: 1, column: 15}),
      end: expect.objectContaining({line: 1, column: 40}),
    }),
  ])
})
