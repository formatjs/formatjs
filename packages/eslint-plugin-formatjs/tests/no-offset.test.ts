import {rule, name} from '../rules/no-offset'
import {ruleTester} from './util'
import {dynamicMessage, noMatch, spreadJsx, emptyFnCall} from './fixtures'
ruleTester.run(name, rule, {
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
          messageId: 'noOffset',
        },
      ],
    },
  ],
})
