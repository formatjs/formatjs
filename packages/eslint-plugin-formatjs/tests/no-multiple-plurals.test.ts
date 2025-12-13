import {name, rule} from '../rules/no-multiple-plurals.js'
import {ruleTester} from './util'
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
                  defaultMessage: '{p1, plural, one{one} other{other}} {p2, plural, one{two} other{other}}'
              })`,
      errors: [
        {
          messageId: 'noMultiplePlurals',
        },
      ],
    },
    {
      code: `
              import {defineMessage} from 'react-intl'
              defineMessage({
                  defaultMessage: '{p1, plural, one{{p2, plural, one{two} other{other}}} other{other}}'
              })`,
      errors: [
        {
          messageId: 'noMultiplePlurals',
        },
      ],
    },
  ],
})
