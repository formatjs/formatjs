import noMultipleWhitespaces from '../src/rules/no-multiple-whitespaces';
import {ruleTester} from './util';
import {dynamicMessage, noMatch, spreadJsx, emptyFnCall} from './fixtures';
ruleTester.run('no-multiple-whitespaces', noMultipleWhitespaces, {
  valid: [
    `import {_} from '@formatjs/macro'
  _({
      defaultMessage: 'a {placeholder}',
      description: 'asd'
  })`,
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
  ],
  invalid: [
    {
      code:
        "import {_} from '@formatjs/macro';_({defaultMessage: 'a \
                  {placeHolder}'})",
      errors: [
        {
          message: 'Multiple consecutive whitespaces are not allowed',
        },
      ],
      output:
        "import {_} from '@formatjs/macro';_({defaultMessage: 'a {placeHolder}'})",
    },
    {
      code: "<FormattedMessage defaultMessage='a   thing'/>",
      errors: [
        {
          message: 'Multiple consecutive whitespaces are not allowed',
        },
      ],
      output: "<FormattedMessage defaultMessage='a thing'/>",
    },
    {
      code: `
              import {_} from '@formatjs/macro'
              _({
                  defaultMessage: 'a   {placeHolder}'
              })`,
      errors: [
        {
          message: 'Multiple consecutive whitespaces are not allowed',
        },
      ],
      output: `
              import {_} from '@formatjs/macro'
              _({
                  defaultMessage: 'a {placeHolder}'
              })`,
    },
  ],
});
