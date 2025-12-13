import {ruleTester} from './util'
import {rule, name} from '../rules/no-camel-case.js'
import {
  dynamicMessage,
  noMatch,
  spreadJsx,
  emptyFnCall,
  defineMessage,
} from './fixtures'

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
