import {Option, name, rule} from '../rules/enforce-description.js'
import {noMatch, spreadJsx, emptyFnCall, dynamicMessage} from './fixtures'
import {ruleTester} from './util'

ruleTester.run(name, rule, {
  valid: [
    `import {defineMessage} from 'react-intl'
defineMessage({
    defaultMessage: '{count, plural, one {#} other {# more}}',
    description: 'asd'
})`,
    `intl.formatMessage({
    defaultMessage: '{count, plural, one {#} other {# more}}',
    description: 'asd'
})`,
    `intl.$t({
    defaultMessage: '{count, plural, one {#} other {# more}}',
    description: 'asd'
})`,
    `intl.formatMessage({
  defaultMessage: '{count, plural, one {#} other {# more}}',
  description: 'asd' + 'aaz'
})`,
    `import {FormattedMessage} from 'react-intl'
const a = <FormattedMessage defaultMessage="{count2, plural, one {#} other {# more}}"
description={'asd' + 'azz'}
/>`,
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
    // minLength: description meets minimum
    {
      code: `import {defineMessage} from 'react-intl'
defineMessage({
    defaultMessage: '{count, plural, one {#} other {# more}}',
    description: 'this is a long enough description'
})`,
      options: [{minLength: 10}],
    },
    // minLength with literal: description meets minimum and is a literal
    {
      code: `intl.formatMessage({
    defaultMessage: '{count, plural, one {#} other {# more}}',
    description: 'this is a long enough description'
})`,
      options: [{minLength: 10, mode: Option.literal}],
    },
    // minLength: description exactly at minimum
    {
      code: `import {defineMessage} from 'react-intl'
defineMessage({
    defaultMessage: '{count, plural, one {#} other {# more}}',
    description: '1234567890'
})`,
      options: [{minLength: 10}],
    },
    // minLength: 1 — any non-empty description passes
    {
      code: `import {defineMessage} from 'react-intl'
defineMessage({
    defaultMessage: '{count, plural, one {#} other {# more}}',
    description: 'x'
})`,
      options: [{minLength: 1}],
    },
    // minLength only with non-literal description: no error (can't statically evaluate)
    {
      code: `import {defineMessage} from 'react-intl'
defineMessage({
    defaultMessage: '{count, plural, one {#} other {# more}}',
    description: foo
})`,
      options: [{minLength: 10}],
    },
  ],
  invalid: [
    {
      code: `
            import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: '{count, plural, one {#} other {# more}}'
            })`,
      errors: [
        {
          messageId: 'enforceDescription',
        },
      ],
    },
    {
      code: `
            import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: '{count, plural, one {#} other {# more}}',
                description: foo
            })`,
      errors: [
        {
          messageId: 'enforceDescriptionLiteral',
        },
      ],
      options: [Option.literal],
    },
    {
      code: `
            intl.formatMessage({
                defaultMessage: '{count, plural, one {#} other {# more}}'
            })`,
      errors: [
        {
          messageId: 'enforceDescription',
        },
      ],
    },
    {
      code: `
            intl.$t({
                defaultMessage: '{count, plural, one {#} other {# more}}'
            })`,
      errors: [
        {
          messageId: 'enforceDescription',
        },
      ],
    },
    {
      code: `
            import {defineMessages} from 'react-intl'
            defineMessages({
              foo: {
                defaultMessage: '{count2, plural, one {#} other {# more}}'
              }
            })`,
      errors: [
        {
          messageId: 'enforceDescription',
        },
      ],
    },
    {
      code: `
              import {defineMessage} from 'react-intl'
              defineMessage({
                foo: {
                  defaultMessage: '{count2, plural, one {#} other {# more}}'
                }
              })`,
      errors: [
        {
          messageId: 'enforceDescription',
        },
      ],
    },
    {
      code: `
            import {FormattedMessage} from 'react-intl'
            const a = <FormattedMessage defaultMessage="{count2, plural, one {#} other {# more}}"/>`,
      errors: [
        {
          messageId: 'enforceDescription',
        },
      ],
    },
    {
      code: `
            import {FormattedMessage} from 'react-intl'
            const a = <FormattedMessage defaultMessage="{count2, plural, one {#} other {# more}}"></FormattedMessage>`,
      errors: [
        {
          messageId: 'enforceDescription',
        },
      ],
    },
    // minLength: description too short via defineMessage
    {
      code: `
            import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: '{count, plural, one {#} other {# more}}',
                description: 'short'
            })`,
      options: [{minLength: 10}],
      errors: [
        {
          messageId: 'enforceDescriptionMinLength',
          data: {minLength: '10', length: '5'},
        },
      ],
    },
    // minLength: description exactly 1 char short of minimum (boundary)
    {
      code: `
            import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: '{count, plural, one {#} other {# more}}',
                description: '123456789'
            })`,
      options: [{minLength: 10}],
      errors: [
        {
          messageId: 'enforceDescriptionMinLength',
          data: {minLength: '10', length: '9'},
        },
      ],
    },
    // minLength: description too short via intl.formatMessage
    {
      code: `
            intl.formatMessage({
                defaultMessage: '{count, plural, one {#} other {# more}}',
                description: 'short'
            })`,
      options: [{minLength: 10}],
      errors: [
        {
          messageId: 'enforceDescriptionMinLength',
          data: {minLength: '10', length: '5'},
        },
      ],
    },
    // minLength: description too short via FormattedMessage JSX
    {
      code: `
            import {FormattedMessage} from 'react-intl'
            const a = <FormattedMessage
              defaultMessage="{count2, plural, one {#} other {# more}}"
              description="short"
            />`,
      options: [{minLength: 10}],
      errors: [
        {
          messageId: 'enforceDescriptionMinLength',
          data: {minLength: '10', length: '5'},
        },
      ],
    },
    // minLength + literal: variable description reports enforceDescriptionLiteral
    {
      code: `
            import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: '{count, plural, one {#} other {# more}}',
                description: foo
            })`,
      options: [{minLength: 10, mode: Option.literal}],
      errors: [
        {
          messageId: 'enforceDescriptionLiteral',
        },
      ],
    },
    // minLength + literal: missing description still reports enforceDescription
    {
      code: `
            import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: '{count, plural, one {#} other {# more}}'
            })`,
      options: [{minLength: 10}],
      errors: [
        {
          messageId: 'enforceDescription',
        },
      ],
    },
  ],
})
