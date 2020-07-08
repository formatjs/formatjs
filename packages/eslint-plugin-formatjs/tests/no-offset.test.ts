import noOffset from '../rules/no-offset';
import {ruleTester} from './util';
import {dynamicMessage, noMatch, spreadJsx, emptyFnCall} from './fixtures';
ruleTester.run('no-offset', noOffset, {
  valid: [
    `import {defineMessage} from 'react-intl'
  defineMessage({
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
              import {defineMessage} from 'react-intl'
              defineMessage({
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
              import {defineMessage} from 'react-intl'
              defineMessage({
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
