import noMultipleWhitespaces from '../rules/no-multiple-whitespaces'
import {ruleTester} from './util'
import {dynamicMessage, noMatch, spreadJsx, emptyFnCall} from './fixtures'
ruleTester.run('no-multiple-whitespaces', noMultipleWhitespaces, {
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
    `
      import {defineMessage} from 'react-intl'
      defineMessage({
        defaultMessage: \`a {
          b, select,
            c {d}
            other {e}
        }\`
      })
    `,
  ],
  invalid: [
    {
      code: "import {defineMessage} from 'react-intl';defineMessage({defaultMessage: 'a \
                  {placeHolder}'})",
      errors: [
        {
          message: 'Multiple consecutive whitespaces are not allowed',
        },
      ],
    },
    {
      code: "<FormattedMessage defaultMessage='a   thing'/>",
      errors: [
        {
          message: 'Multiple consecutive whitespaces are not allowed',
        },
      ],
    },
    {
      code: `
              import {defineMessage} from 'react-intl'
              defineMessage({
                  defaultMessage: 'a   {placeHolder}'
              })`,
      errors: [
        {
          message: 'Multiple consecutive whitespaces are not allowed',
        },
      ],
    },
    {
      code: `
        import {defineMessage} from 'react-intl'
        defineMessage({
          defaultMessage: \`{a, select,
            b {{c, plural, one {  d} other { #}}}
            other {e}
          }\`
        })
      `,
      errors: [
        {
          message: 'Multiple consecutive whitespaces are not allowed',
        },
      ],
    },
  ],
})
