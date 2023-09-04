import noUselessMessage from '../rules/no-useless-message'
import {ruleTester} from './util'
import {
  dynamicMessage,
  noMatch,
  spreadJsx,
  emptyFnCall,
  defineMessage,
} from './fixtures'

ruleTester.run('no-useless-message', noUselessMessage, {
  valid: [defineMessage, dynamicMessage, noMatch, spreadJsx, emptyFnCall],
  invalid: [
    {
      code: `
      import {FormattedMessage} from 'react-intl';
      <FormattedMessage defaultMessage="{test}" />
      `,
      errors: [{message: 'Unnecessary formatted message.'}],
    },
    {
      code: `
      import {FormattedMessage} from 'react-intl';
      <FormattedMessage defaultMessage="{test, number}" />
      `,
      errors: [
        {
          message:
            'Unnecessary formatted message: just use FormattedNumber or intl.formatNumber.',
        },
      ],
    },
    {
      code: `
      import {FormattedMessage} from 'react-intl';
      <FormattedMessage defaultMessage="{test, date}" />
      `,
      errors: [
        {
          message:
            'Unnecessary formatted message: just use FormattedDate or intl.formatDate.',
        },
      ],
    },
    {
      code: `
      import {FormattedMessage} from 'react-intl';
      <FormattedMessage defaultMessage="{test, time}" />
      `,
      errors: [
        {
          message:
            'Unnecessary formatted message: just use FormattedTime or intl.formatTime.',
        },
      ],
    },
  ],
})
