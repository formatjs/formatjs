import noOffset from '../src/rules/no-offset';
import {ruleTester} from './util';
import {dynamicMessage, noMatch, spreadJsx, emptyFnCall} from './fixtures';
ruleTester.run('no-offset', noOffset, {
  valid: [
    `import {_} from '@formatjs/macro'
  _({
      defaultMessage: '{count, plural, one {#} other {# more}}'
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
                  defaultMessage: '{count, plural, offset:1 one {#} other {# more}}'
              })`,
      errors: [
        {
          message: 'offset are not allowed in plural rules',
        },
      ],
    },
    {
      code: `
              import {_} from '@formatjs/macro'
              _({
                  defaultMessage: '{count, plural, offset:1 one {#} other {# more}'
              })`,
      errors: [
        {
          message: 'Expected "=", "}", or argName but end of input found.',
        },
      ],
    },
  ],
});
