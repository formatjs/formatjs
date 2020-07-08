import enforceDescription from '../rules/enforce-description';
import {noMatch, spreadJsx, emptyFnCall, dynamicMessage} from './fixtures';
import {ruleTester} from './util';

ruleTester.run('enforce-description', enforceDescription, {
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
          message: '`description` has to be specified in message descriptor',
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
          message:
            '`description` has to be a string literal (not function call or variable)',
        },
      ],
      options: ['literal'],
    },
    {
      code: `
            intl.formatMessage({
                defaultMessage: '{count, plural, one {#} other {# more}}'
            })`,
      errors: [
        {
          message: '`description` has to be specified in message descriptor',
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
          message: '`description` has to be specified in message descriptor',
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
          message: '`description` has to be specified in message descriptor',
        },
      ],
    },
    {
      code: `
            import {FormattedMessage} from 'react-intl'
            const a = <FormattedMessage defaultMessage="{count2, plural, one {#} other {# more}}"/>`,
      errors: [
        {
          message: '`description` has to be specified in message descriptor',
        },
      ],
    },
    {
      code: `
            import {FormattedMessage} from 'react-intl'
            const a = <FormattedMessage defaultMessage="{count2, plural, one {#} other {# more}}"></FormattedMessage>`,
      errors: [
        {
          message: '`description` has to be specified in message descriptor',
        },
      ],
    },
  ],
});
