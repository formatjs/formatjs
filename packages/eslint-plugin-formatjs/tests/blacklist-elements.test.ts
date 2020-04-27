import blacklistElements from '../src/rules/blacklist-elements';
import {ruleTester} from './util';
import {dynamicMessage, noMatch, spreadJsx, emptyFnCall} from './fixtures';
ruleTester.run('blacklist-elements', blacklistElements, {
  valid: [
    {
      code: `import {_} from '@formatjs/macro'
  _({
      defaultMessage: '{count, plural, one {#} other {# more}}'
  })`,
      options: [['selectordinal']],
    },
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
                  defaultMessage: '{count, selectordinal, offset:1 one {#} other {# more}}'
              })`,
      options: [['selectordinal']],
      errors: [
        {
          message: 'selectordinal element is blacklisted',
        },
      ],
    },
  ],
});
