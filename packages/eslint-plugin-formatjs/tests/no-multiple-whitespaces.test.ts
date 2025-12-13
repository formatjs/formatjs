import {name, rule} from '../rules/no-multiple-whitespaces.js'
import {
  defineMessage,
  dynamicMessage,
  emptyFnCall,
  noMatch,
  spreadJsx,
} from './fixtures'
import {ruleTester} from './util'

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
        defaultMessage: \`a {
          b, select,
            c {d}
            other {e}
        }\`
      })
    `,
    },
  ],
  invalid: [
    {
      code: "import {defineMessage} from 'react-intl';defineMessage({defaultMessage: 'a \
                  {placeHolder}'})",
      errors: [
        {
          messageId: 'noMultipleWhitespaces',
        },
      ],
      output: `import {defineMessage} from 'react-intl';defineMessage({defaultMessage: "a {placeHolder}"})`,
    },
    {
      code: "<FormattedMessage defaultMessage='a   thing'/>",
      errors: [
        {
          messageId: 'noMultipleWhitespaces',
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
          messageId: 'noMultipleWhitespaces',
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
          messageId: 'noMultipleWhitespaces',
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
          messageId: 'noMultipleWhitespaces',
        },
      ],
      output:
        "import {defineMessage} from 'react-intl';defineMessage({defaultMessage: `a\\\\ \\` {placeHolder}`})",
    },
    {
      code: "import {defineMessage} from 'react-intl';defineMessage({defaultMessage: `<em>a  b</em>`})",
      errors: [{messageId: 'noMultipleWhitespaces'}],
      output:
        "import {defineMessage} from 'react-intl';defineMessage({defaultMessage: `<em>a b</em>`})",
    },
    // Multi-line JSX attribute
    {
      code: `<FormattedMessage defaultMessage="a\n  b" />`,
      errors: [{messageId: 'noMultipleWhitespaces'}],
      output: `<FormattedMessage defaultMessage="a b" />`,
    },
  ],
})
