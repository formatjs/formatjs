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
  ],
})
