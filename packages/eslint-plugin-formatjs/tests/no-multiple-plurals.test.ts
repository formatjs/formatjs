import noMultiplePlurals from '../rules/no-multiple-plurals'
import {ruleTester} from './util'
import {
  dynamicMessage,
  noMatch,
  spreadJsx,
  emptyFnCall,
  defineMessage,
} from './fixtures'
ruleTester.run('no-multiple-plurals', noMultiplePlurals, {
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
          message: 'Cannot specify more than 1 plural rules',
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
          message: 'Cannot specify more than 1 plural rules',
        },
      ],
    },
  ],
})
