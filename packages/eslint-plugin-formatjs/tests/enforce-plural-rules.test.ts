import enforcePluralRules from '../src/rules/enforce-plural-rules';
import {ruleTester} from './util';
import {dynamicMessage, noMatch, spreadJsx, emptyFnCall} from './fixtures';
ruleTester.run('enforce-plural-rules', enforcePluralRules, {
  valid: [
    {
      code: `import {defineMessage} from 'react-intl'
  _({
      defaultMessage: '{count, plural, one {#} other {# more}}',
      description: 'asd'
  })`,
      options: [
        {
          one: true,
        },
      ],
    },
    {
      code: `import {defineMessage} from 'react-intl'
  _({
      defaultMessage: '{count, plural, one {#} other {# more}}',
      description: 'asd'
  })`,
      options: [
        {
          other: true,
        },
      ],
    },
    {
      code: `import {defineMessage} from 'react-intl'
  _({
      defaultMessage: '{count, plural, one {#} other {# more}}',
      description: 'asd'
  })`,
      options: [
        {
          one: true,
          other: true,
          zero: false,
        },
      ],
    },
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
  ],
  invalid: [
    {
      code: `
              import {defineMessage} from 'react-intl'
              _({
                  defaultMessage: '{count, plural, one {#} other {# more}}'
              })`,
      options: [
        {
          one: false,
        },
      ],
      errors: [
        {
          message: 'Plural rule "one" is forbidden',
        },
      ],
    },
    {
      code: `
              import {defineMessage} from 'react-intl'
              _({
                  defaultMessage: '{count, plural, one {#}}'
              })`,
      options: [
        {
          one: true,
          other: true,
        },
      ],
      errors: [
        {
          message: 'Missing plural rule "other"',
        },
      ],
    },
  ],
});
