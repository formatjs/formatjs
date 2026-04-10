import {name, rule} from '#packages/eslint-plugin-formatjs/rules/no-offset.js'
import {
  dynamicMessage,
  emptyFnCall,
  noMatch,
  spreadJsx,
} from '#packages/eslint-plugin-formatjs/tests/fixtures'
import {ruleTester} from '#packages/eslint-plugin-formatjs/tests/util'
ruleTester.run(name, rule, {
  valid: [
    {
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: '{count, plural, one {#} other {# more}}'
  })`,
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
                  defaultMessage: '{count, plural, offset:1 one {#} other {# more}}'
              })`,
      errors: [
        {
          messageId: 'noOffset',
        },
      ],
    },
  ],
})
