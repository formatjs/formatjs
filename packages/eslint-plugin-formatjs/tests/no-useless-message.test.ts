import {
  name,
  rule,
} from '#packages/eslint-plugin-formatjs/rules/no-useless-message.js'
import {ruleTester} from '#packages/eslint-plugin-formatjs/tests/util'
import {
  dynamicMessage,
  noMatch,
  spreadJsx,
  emptyFnCall,
  defineMessage,
} from '#packages/eslint-plugin-formatjs/tests/fixtures'

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
