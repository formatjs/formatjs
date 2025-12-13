import {rule, name, Option} from '../rules/enforce-default-message.js'
import {noMatch, spreadJsx, emptyFnCall, dynamicMessage} from './fixtures'
import {ruleTester, vueRuleTester} from './util'

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
    `import {FormattedMessage} from 'react-intl'
const a = <FormattedMessage defaultMessage={'asf' + 'bar'}/>`,
    `import {FormattedMessage} from 'react-intl'
const a = <FormattedMessage defaultMessage={dedent\`asf\`}/>`,
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
