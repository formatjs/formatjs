import noComplexSelectors from '../rules/no-complex-selectors'
import {ruleTester} from './util'
import {
  dynamicMessage,
  noMatch,
  spreadJsx,
  emptyFnCall,
  defineMessage,
} from './fixtures'
ruleTester.run('no-complex-selectors', noComplexSelectors, {
  valid: [
    defineMessage,
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
    {
      code: `
              import {defineMessage} from 'react-intl'
              defineMessage({
                  defaultMessage: '{p1, plural, one{one} other{other}}'
              })`,
      options: [
        {
          limit: 2,
        },
      ],
    },
  ],
  invalid: [
    // Syntax error
    {
      code: `
        import {defineMessage} from 'react-intl'
        defineMessage({
            defaultMessage: '{'
        })
      `,
      options: [{limit: 1}],
      errors: [{message: 'EXPECT_ARGUMENT_CLOSING_BRACE'}],
    },
    {
      code: `
              import {defineMessage} from 'react-intl'
              defineMessage({
                  defaultMessage: '{p1, plural, one{one} other{other}} {p2, plural, one{two} other{other}}'
              })`,
      options: [
        {
          limit: 1,
        },
      ],
      errors: [
        {
          message: 'Message complexity is too high (4 vs limit at 1)',
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
                            other{other}
                        } <b>dog</b>
                    } 
                    other{many dogs}} and {count, plural, 
                        one{a {
                            gender, select, 
                                male{male} 
                                female{female}
                                other{other}
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
          message: 'Message complexity is too high (16 vs limit at 3)',
        },
      ],
    },
    {
      code: `
              import {defineMessage} from 'react-intl'
              defineMessage({
                  defaultMessage: '{p1, plural, one{{p2, plural, one{two} other{other}}} other{other}}'
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
    {
      code: `
              import {defineMessage} from 'react-intl'
              defineMessage({
                  defaultMessage: '{p1, plural, one{one {foo, select, bar{two} baz{three} other{other}}} other{other}}'
              })`,
      options: [
        {
          limit: 1,
        },
      ],
      errors: [
        {
          message: 'Message complexity is too high (4 vs limit at 1)',
        },
      ],
    },
    {
      code: `
              import {defineMessage} from 'react-intl'
              defineMessage({
                  defaultMessage: '<b>{p1, plural, one{one} other{other}}</b>'
              })`,
      options: [
        {
          limit: 1,
        },
      ],
      errors: [{message: 'Message complexity is too high (2 vs limit at 1)'}],
    },
  ],
})
