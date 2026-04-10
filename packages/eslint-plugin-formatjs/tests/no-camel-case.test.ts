import {ruleTester} from '#packages/eslint-plugin-formatjs/tests/util'
import {
  rule,
  name,
} from '#packages/eslint-plugin-formatjs/rules/no-camel-case.js'
import {
  dynamicMessage,
  noMatch,
  spreadJsx,
  emptyFnCall,
  defineMessage,
} from '#packages/eslint-plugin-formatjs/tests/fixtures'

ruleTester.run(name, rule, {
  valid: [defineMessage, dynamicMessage, noMatch, spreadJsx, emptyFnCall],
  invalid: [
    {
      code: `
              import {defineMessage} from 'react-intl'
              defineMessage({
                  defaultMessage: 'a {placeHolder}'
              })`,
      errors: [{messageId: 'camelcase'}],
    },
  ],
})
