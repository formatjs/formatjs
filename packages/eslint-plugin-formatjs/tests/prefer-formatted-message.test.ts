import {rule, name} from '../rules/prefer-formatted-message.js'
import {ruleTester} from './util'
import {
  dynamicMessage,
  noMatch,
  spreadJsx,
  emptyFnCall,
  defineMessage,
} from './fixtures'

ruleTester.run(name, rule, {
  valid: [
    defineMessage,
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
    {
      code: `
      <div>
        <FormattedMessage defaultMessage="test" />
      </div>
      `,
    },
    {
      code: `<img src="/example.png" alt={intl.formatMessage({defaultMessage: 'test'})} />`,
    },
  ],
  invalid: [
    {
      code: `
      <div>
        {intl.formatMessage({
          defaultMessage: 'test',
        })}
      </div>
      `,
      errors: [
        {
          messageId: 'jsxChildren',
        },
      ],
    },
    {
      code: `
      <div>
        {intl.formatMessage({
          defaultMessage: 'hello',
        })}
        {' '}
        {intl.formatMessage({
          defaultMessage: 'world',
        })}
      </div>
      `,
      errors: [
        {
          messageId: 'jsxChildren',
        },
        {
          messageId: 'jsxChildren',
        },
      ],
    },
  ],
})
