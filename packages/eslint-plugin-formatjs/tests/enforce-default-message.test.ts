import {Linter} from 'eslint'
import {expect, test} from 'vitest'
import plugin from '#packages/eslint-plugin-formatjs/index.js'
import {
  rule,
  name,
  Option,
} from '#packages/eslint-plugin-formatjs/rules/enforce-default-message.js'
import {
  noMatch,
  spreadJsx,
  emptyFnCall,
  dynamicMessage,
} from '#packages/eslint-plugin-formatjs/tests/fixtures'
import {
  ruleTester,
  vueRuleTester,
} from '#packages/eslint-plugin-formatjs/tests/util'

test.each(['recommended', 'strict'] as const)(
  '%s allows overriding literal while still requiring defaultMessage',
  preset => {
    const linter = new Linter()
    const code = `import {FormattedMessage} from 'react-intl'
const missing = <FormattedMessage />
const dynamic = <FormattedMessage defaultMessage={message} />`
    const verify = (setting: Linter.RuleEntry) =>
      linter
        .verify(code, [
          plugin.configs[preset],
          {
            languageOptions: {
              parserOptions: {ecmaFeatures: {jsx: true}},
            },
            rules: {'formatjs/enforce-default-message': setting},
          },
        ])
        .filter(
          message => message.ruleId === 'formatjs/enforce-default-message'
        )
        .map(({messageId, line}) => ({messageId, line}))

    const literalErrors = [
      {messageId: 'defaultMessage', line: 2},
      {messageId: 'defaultMessageLiteral', line: 3},
    ]
    expect(verify('error')).toEqual(literalErrors)
    expect(verify(['error'])).toEqual(literalErrors)
    expect(verify(['error', Option.anything])).toEqual([
      {messageId: 'defaultMessage', line: 2},
    ])
  }
)

ruleTester.run(name, rule, {
  valid: [
    `import {defineMessage} from 'react-intl'
defineMessage({
    defaultMessage: 'this is default message',
    description: 'asd'
})`,
    `intl.formatMessage({
    defaultMessage: 'this is default message',
    description: 'asd'
})`,
    `intl.formatMessage({
  defaultMessage: 'this is default message' + 'vvv',
  description: 'asd'
})`,
    `intl.formatMessage({
  defaultMessage: \`a template
  literal
\`,
  description: 'asd'
})`,
    `intl.formatMessage({
  defaultMessage: dedent\`a template
  literal
\`,
  description: 'asd'
})`,
    `type DefaultMessage = string
intl.formatMessage({
  defaultMessage: \`a template
  literal
\` satisfies DefaultMessage,
  description: 'asd'
})`,
    `type Foo = string
intl.formatMessage({
  defaultMessage: 'foo' as Foo,
  description: 'asd'
})`,
    `type Bar = string
intl.formatMessage({
  defaultMessage: \`foo\` as Bar,
  description: 'asd'
})`,
    `import {FormattedMessage} from 'react-intl'
const a = <FormattedMessage defaultMessage={'asf' + 'bar'}/>`,
    `import {FormattedMessage} from 'react-intl'
const a = <FormattedMessage defaultMessage={dedent\`asf\`}/>`,
    `import {FormattedMessage} from 'react-intl'
type DefaultMessage = string
const a = <FormattedMessage defaultMessage={\`asf\` satisfies DefaultMessage}/>`,
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
  ],
  invalid: [
    {
      code: `
            import {defineMessage} from 'react-intl'
            defineMessage({
                description: 'this is default message'
            })`,
      errors: [
        {
          messageId: 'defaultMessage',
        },
      ],
    },
    {
      code: `
            import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage,
                description: 'this is default message'
            })`,
      errors: [
        {
          messageId: 'defaultMessageLiteral',
        },
      ],
      options: [Option.literal],
    },
    {
      code: `
            intl.formatMessage({
                defaultMessage,
                description: 'this is default message'
            })`,
      errors: [
        {
          messageId: 'defaultMessageLiteral',
        },
      ],
      options: [Option.literal],
    },
    {
      code: `
            import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: foo
            })`,
      errors: [
        {
          messageId: 'defaultMessageLiteral',
        },
      ],
      options: [Option.literal],
    },
    {
      code: `
            intl.formatMessage({
                description: 'this is description'
            })`,
      errors: [
        {
          messageId: 'defaultMessage',
        },
      ],
    },
    {
      code: `
            import {defineMessages} from 'react-intl'
            defineMessages({
              foo: {
                description: 'this is description'
              }
            })`,
      errors: [
        {
          messageId: 'defaultMessage',
        },
      ],
    },
    {
      code: `
            import {FormattedMessage} from 'react-intl'
            const a = <FormattedMessage description="this is description"/>`,
      errors: [
        {
          messageId: 'defaultMessage',
        },
      ],
    },
    {
      code: `
            import {FormattedMessage} from 'react-intl'
            const a = <FormattedMessage />`,
      errors: [
        {
          messageId: 'defaultMessage',
        },
      ],
    },
    {
      code: `
            import {FormattedMessage} from 'react-intl'
            const a = <FormattedMessage description="this is description"></FormattedMessage>`,
      errors: [
        {
          messageId: 'defaultMessage',
        },
      ],
    },
    {
      code: `
            import {FormattedMessage} from 'react-intl'
            const a = <FormattedMessage defaultMessage={defaultMessage} description="this is description"/>`,
      errors: [
        {
          messageId: 'defaultMessageLiteral',
        },
      ],
      options: [Option.literal],
    },
    {
      code: `
            import {FormattedMessage} from 'react-intl'
            const a = <FormattedMessage defaultMessage={defaultMessage}/>`,
      errors: [
        {
          messageId: 'defaultMessageLiteral',
        },
      ],
      options: [Option.literal],
    },
    {
      code: `
            import {FormattedMessage} from 'react-intl'
            const a = <FormattedMessage defaultMessage={\`asf \${foo}\`} description="this is description"></FormattedMessage>`,
      errors: [
        {
          messageId: 'defaultMessageLiteral',
        },
      ],
      options: [Option.literal],
    },
    {
      code: `
            import {FormattedMessage} from 'react-intl'
            const a = <FormattedMessage defaultMessage={\`asf \${aas}\`}/>`,
      errors: [
        {
          messageId: 'defaultMessageLiteral',
        },
      ],
      options: [Option.literal],
    },
    {
      code: `
            import {FormattedMessage} from 'react-intl'
            type DefaultMessage = string
            const a = <FormattedMessage defaultMessage={\`asf \${aas}\` satisfies DefaultMessage}/>`,
      errors: [
        {
          messageId: 'defaultMessageLiteral',
        },
      ],
      options: [Option.literal],
    },
  ],
})

vueRuleTester.run(`vue-${name}`, rule, {
  valid: [
    `<template>
<p>{{$formatMessage({
    defaultMessage: 'this is default message',
    description: 'asd'
})}}</p></template>`,
    `<script>intl.formatMessage({
    defaultMessage: 'this is default message',
    description: 'asd'
})</script>`,
    `<script>intl.formatMessage({
  defaultMessage: 'this is default message' + 'vvv',
  description: 'asd'
})</script>`,
  ],
  invalid: [
    {
      code: `
      <template>
      <p>{{$formatMessage({
                description: 'this is default message'
            })}}</p></template>`,
      errors: [
        {
          messageId: 'defaultMessage',
        },
      ],
    },
    {
      code: `
      <template>
      <p>{{$formatMessage({
                defaultMessage,
                description: 'this is default message'
            })}}</p></template>`,
      errors: [
        {
          messageId: 'defaultMessageLiteral',
        },
      ],
      options: [Option.literal],
    },
  ],
})
