import {name, rule} from '../rules/no-useless-message.js'
import {ruleTester} from './util'
import {
  dynamicMessage,
  noMatch,
  spreadJsx,
  emptyFnCall,
  defineMessage,
} from './fixtures'

ruleTester.run(name, rule, {
  valid: [defineMessage, dynamicMessage, noMatch, spreadJsx, emptyFnCall],
  invalid: [
    {
      code: `
      import {FormattedMessage} from 'react-intl';
      <FormattedMessage defaultMessage="{test}" />
      `,
      errors: [{messageId: 'unnecessaryFormat'}],
    },
    {
      code: `
      import {FormattedMessage} from 'react-intl';
      <FormattedMessage defaultMessage="{test, number}" />
      `,
      errors: [
        {
          messageId: 'unnecessaryFormatNumber',
        },
      ],
    },
    {
      code: `
      import {FormattedMessage} from 'react-intl';
      <FormattedMessage defaultMessage="{test, date}" />
      `,
      errors: [{messageId: 'unnecessaryFormatDate'}],
    },
    {
      code: `
      import {FormattedMessage} from 'react-intl';
      <FormattedMessage defaultMessage="{test, time}" />
      `,
      errors: [{messageId: 'unnecessaryFormatTime'}],
    },
  ],
})
