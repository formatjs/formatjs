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
    // GH #4890: formatMessage in attributes (not JSX children) should still be valid
    {
      code: `<img src="/example.png" alt={formatMessage({defaultMessage: 'test'})} />`,
    },
    // GH #4890: formatMessage with non-object argument should not be flagged
    {
      code: `
      <div>
        {formatMessage(someVariable)}
      </div>
      `,
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
    // GH #4890: Destructured formatMessage should also be detected
    {
      code: `
      <div>
        {formatMessage({
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
        {formatMessage({
          defaultMessage: 'hello',
        })}
        {' '}
        {formatMessage({
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
    // GH #4890: $t alias should also work
    {
      code: `
      <div>
        {$t({
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
  ],
})
