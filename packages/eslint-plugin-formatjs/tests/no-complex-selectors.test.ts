import noComplexSelectors from '../rules/no-complex-selectors'
import {ruleTester} from './util'
import {dynamicMessage, noMatch, spreadJsx, emptyFnCall} from './fixtures'
ruleTester.run('no-complext-selectors', noComplexSelectors, {
  valid: [
    `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a {placeholder}',
      description: 'asd'
  })`,
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
    {
      code: `
              import {defineMessage} from 'react-intl'
              defineMessage({
                  defaultMessage: '{p1, plural, one{one}} {p2, plural, one{two}}'
              })`,
      options: [
        {
          limit: 1,
        },
      ],
    },
  ],
  invalid: [
    {
      code: `
              import {defineMessage} from 'react-intl'
              defineMessage({
                  defaultMessage: '{p1, plural, one{one} other{other}} {p2, plural, one{two}}'
              })`,
      options: [
        {
          limit: 1,
        },
      ],
      errors: [
        {
          message: 'Message complexity is too high (2 vs limit at 1)',
        },
      ],
    },
    {
      code: `
              import {defineMessage} from 'react-intl'
              defineMessage({
                  defaultMessage: \`I have {count, plural, 
                    one{a {
                        gender, select, 
                            male{male} 
                            female{female} 
                        } <b>dog</b>
                    } 
                    other{many dogs}} and {count, plural, 
                        one{a {
                            gender, select, 
                                male{male} 
                                female{female} 
                            } <strong>cat</strong>
                        } 
                        other{many cats}}\`
              })`,
      options: [
        {
          limit: 3,
        },
      ],
      errors: [
        {
          message: 'Message complexity is too high (9 vs limit at 3)',
        },
      ],
    },
    {
      code: `
              import {defineMessage} from 'react-intl'
              defineMessage({
                  defaultMessage: '{p1, plural, one{{p2, plural, one{two} other{other}}}}'
              })`,
      options: [
        {
          limit: 1,
        },
      ],
      errors: [
        {
          message: 'Message complexity is too high (2 vs limit at 1)',
        },
      ],
    },
    {
      code: `
              import {defineMessage} from 'react-intl'
              defineMessage({
                  defaultMessage: '{p1, plural, one{one {foo, select, bar{two} baz{three}}} other{other} }}'
              })`,
      options: [
        {
          limit: 1,
        },
      ],
      errors: [
        {
          message: 'Message complexity is too high (3 vs limit at 1)',
        },
      ],
    },
  ],
})
