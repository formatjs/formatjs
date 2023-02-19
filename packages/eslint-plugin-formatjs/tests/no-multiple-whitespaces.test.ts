import noMultipleWhitespaces from '../rules/no-multiple-whitespaces'
import {ruleTester} from './util'
import {
  dynamicMessage,
  noMatch,
  spreadJsx,
  emptyFnCall,
  defineMessage,
} from './fixtures'

ruleTester.run('no-multiple-whitespaces', noMultipleWhitespaces, {
  valid: [
    defineMessage,
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
      output: `import {defineMessage} from 'react-intl';defineMessage({defaultMessage: "a {placeHolder}"})`,
    },
    {
      code: "<FormattedMessage defaultMessage='a   thing'/>",
      errors: [
        {
          message: 'Multiple consecutive whitespaces are not allowed',
        },
      ],
      output: `<FormattedMessage defaultMessage="a thing"/>`,
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
      output: `
              import {defineMessage} from 'react-intl'
              defineMessage({
                  defaultMessage: "a {placeHolder}"
              })`,
    },
    {
      code: `
        import {defineMessage} from 'react-intl'
        defineMessage({
          defaultMessage: \`hello     {a, select,
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
      output: `
        import {defineMessage} from 'react-intl'
        defineMessage({
          defaultMessage: \`hello {a, select,
            b {{c, plural, one { d} other { #}}}
            other {e}
          }\`
        })
      `,
    },
    // Backslash escapes in the template literals
    {
      code: "import {defineMessage} from 'react-intl';defineMessage({defaultMessage: `a\\\\  \\`  {placeHolder}`})",
      errors: [
        {
          message: 'Multiple consecutive whitespaces are not allowed',
        },
      ],
      output:
        "import {defineMessage} from 'react-intl';defineMessage({defaultMessage: `a\\\\ \\` {placeHolder}`})",
    },
    {
      code: "import {defineMessage} from 'react-intl';defineMessage({defaultMessage: `<em>a  b</em>`})",
      errors: [{message: 'Multiple consecutive whitespaces are not allowed'}],
      output:
        "import {defineMessage} from 'react-intl';defineMessage({defaultMessage: `<em>a b</em>`})",
    },
  ],
})
