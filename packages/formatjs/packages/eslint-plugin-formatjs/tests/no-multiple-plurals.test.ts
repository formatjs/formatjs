import noMultiplePlurals from '../src/rules/no-multiple-plurals';
import {ruleTester} from './util';
import {dynamicMessage, noMatch, spreadJsx, emptyFnCall} from './fixtures';
ruleTester.run('no-multiple-plurals', noMultiplePlurals, {
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
      code: `
              import {_} from '@formatjs/macro'
              _({
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
              import {_} from '@formatjs/macro'
              _({
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
