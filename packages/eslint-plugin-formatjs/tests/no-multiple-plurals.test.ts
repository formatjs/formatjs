import noMultiplePlurals from '../rules/no-multiple-plurals';
import {ruleTester} from './util';
import {dynamicMessage, noMatch, spreadJsx, emptyFnCall} from './fixtures';
ruleTester.run('no-multiple-plurals', noMultiplePlurals, {
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
  ],
  invalid: [
    {
      code: `
              import {defineMessage} from 'react-intl'
              defineMessage({
                  defaultMessage: '{p1, plural, one{one}} {p2, plural, one{two}}'
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
                  defaultMessage: '{p1, plural, one{{p2, plural, one{two}}}}'
              })`,
      errors: [
        {
          message: 'Cannot specify more than 1 plural rules',
        },
      ],
    },
  ],
});
