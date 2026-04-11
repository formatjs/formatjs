import {
  name,
  rule,
} from '#packages/eslint-plugin-formatjs/rules/enforce-plural-rules.js'
import {ruleTester} from '#packages/eslint-plugin-formatjs/tests/util'
import {
  dynamicMessage,
  noMatch,
  spreadJsx,
  emptyFnCall,
} from '#packages/eslint-plugin-formatjs/tests/fixtures'
ruleTester.run(name, rule, {
  valid: [
    {
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
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
  defineMessage({
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
  defineMessage({
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
              defineMessage({
                  defaultMessage: '{count, plural, one {#} other {# more}}'
              })`,
      options: [
        {
          one: false,
        },
      ],
      errors: [
        {
          messageId: 'forbidden',
          data: {rule: 'one'},
        },
      ],
    },
    {
      code: `
              import {defineMessage} from 'react-intl'
              defineMessage({
                  defaultMessage: '{count, plural, one {#} other{other}}'
              })`,
      options: [
        {
          one: true,
          two: true,
        },
      ],
      errors: [
        {
          messageId: 'missingPlural',
          data: {rule: 'two'},
        },
      ],
    },
  ],
})
