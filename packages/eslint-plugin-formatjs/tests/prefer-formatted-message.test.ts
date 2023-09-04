import preferFormattedMessage from '../rules/prefer-formatted-message'
import {ruleTester} from './util'
import {
  dynamicMessage,
  noMatch,
  spreadJsx,
  emptyFnCall,
  defineMessage,
} from './fixtures'

ruleTester.run('prefer-formatted-message', preferFormattedMessage, {
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
          message:
            'Prefer `FormattedMessage` over `intl.formatMessage` in the JSX children expression.',
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
          message:
            'Prefer `FormattedMessage` over `intl.formatMessage` in the JSX children expression.',
        },
        {
          message:
            'Prefer `FormattedMessage` over `intl.formatMessage` in the JSX children expression.',
        },
      ],
    },
  ],
})
