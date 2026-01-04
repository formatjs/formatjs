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
  valid: [
    defineMessage,
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
    {
      code: `
      import {FormattedMessage} from 'react-intl';
      <FormattedMessage defaultMessage="{test}" description="Reason for simple message" />
      `,
      options: [{allowWithDescription: true}],
    },
    {
      code: `
      import {FormattedMessage} from 'react-intl';
      <FormattedMessage defaultMessage="{test, number}" description="Needed for other locales" />
      `,
      options: [{allowWithDescription: true}],
    },
    {
      code: `
      import {FormattedMessage} from 'react-intl';
      <FormattedMessage defaultMessage="{test, date}" description="Date formatting context" />
      `,
      options: [{allowWithDescription: true}],
    },
    {
      code: `
      import {FormattedMessage} from 'react-intl';
      <FormattedMessage defaultMessage="{test, time}" description="Time display reason" />
      `,
      options: [{allowWithDescription: true}],
    },
    {
      code: `
      import {defineMessage} from 'react-intl';
      defineMessage({
        defaultMessage: '{count}',
        description: 'Simple count for EN, but needs translation structure'
      })
      `,
      options: [{allowWithDescription: true}],
    },
  ],
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
    {
      code: `
      import {FormattedMessage} from 'react-intl';
      <FormattedMessage defaultMessage="{test}" />
      `,
      options: [{allowWithDescription: true}],
      errors: [{messageId: 'unnecessaryFormat'}],
    },
    {
      code: `
      import {FormattedMessage} from 'react-intl';
      <FormattedMessage defaultMessage="{test, number}" />
      `,
      options: [{allowWithDescription: true}],
      errors: [{messageId: 'unnecessaryFormatNumber'}],
    },
    {
      code: `
      import {FormattedMessage} from 'react-intl';
      <FormattedMessage defaultMessage="{test}" description="Has description" />
      `,
      options: [{allowWithDescription: false}],
      errors: [{messageId: 'unnecessaryFormat'}],
    },
    {
      code: `
      import {FormattedMessage} from 'react-intl';
      <FormattedMessage defaultMessage="{test}" description="Has description" />
      `,
      options: [],
      errors: [{messageId: 'unnecessaryFormat'}],
    },
    {
      code: `
      import {FormattedMessage} from 'react-intl';
      <FormattedMessage defaultMessage="{test, number}" description="Has description" />
      `,
      errors: [{messageId: 'unnecessaryFormatNumber'}],
    },
  ],
})
