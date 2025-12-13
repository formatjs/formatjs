import {rule, name} from '../rules/no-complex-selectors.js'
import {ruleTester} from './util'
import {
  dynamicMessage,
  noMatch,
  spreadJsx,
  emptyFnCall,
  defineMessage,
} from './fixtures'
ruleTester.run(name, rule, {
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
      errors: [
        {
          messageId: 'parserError',
          data: {message: 'EXPECT_ARGUMENT_CLOSING_BRACE'},
        },
      ],
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
      errors: [{messageId: 'tooComplex', data: {complexity: 4, limit: 1}}],
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
      errors: [{messageId: 'tooComplex', data: {complexity: 16, limit: 3}}],
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
          messageId: 'tooComplex',
          data: {
            complexity: 3,
            limit: 1,
          },
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
          messageId: 'tooComplex',
          data: {
            complexity: 4,
            limit: 1,
          },
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
      errors: [
        {
          messageId: 'tooComplex',
          data: {
            complexity: 2,
            limit: 1,
          },
        },
      ],
    },
  ],
})
