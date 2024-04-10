import {name, rule} from '../rules/no-invalid-icu'
import {ruleTester} from './util'
import {dynamicMessage, noMatch, spreadJsx, emptyFnCall} from './fixtures'

ruleTester.run(name, rule, {
  valid: [
    `intl.formatMessage({
      defaultMessage: '{count, plural, one {#} other {# more}}',
      description: 'asd'
  }, {count: 1})`,
    `this.intl.formatMessage({
      defaultMessage: '{count, plural, one {#} other {# more}}',
      description: 'asd'
  }, {count: 1})`,
    `IntlStore.intl.formatMessage({
      defaultMessage: '{count, plural, one {#} other {# more}}',
      description: 'asd'
  }, {count: 1})`,
    `intl.formatMessage({
    defaultMessage: '{count, plural, one {#} other {# more}}',
    description: 'asd'
  }, {'count': 1})`,
    `import {FormattedMessage} from 'react-intl'
  const a = <FormattedMessage
  defaultMessage="{count, plural, one {#} other {# more}}"
  values={{ count: 1}} />
        `,
    `import {FormattedMessage} from 'react-intl'
  const a = <FormattedMessage
  defaultMessage="{count, plural, one {#} other {# more}} {bar}"
  values={{ 'count': 1, bar: 2}} />
        `,
    `import {defineMessages, _} from 'react-intl'
  defineMessages({
    foo: {
      defaultMessage: '{count, plural, one {#} other {# more}}',
      description: 'asd'
    }
  })
  defineMessage({
    defaultMessage: '{count, plural, one {#} other {# more}}',
    description: 'asd'
  })
  `,
    `
  intl.formatMessage({
    defaultMessage: '{count, plural, one {<a>#</a>} other {# more}}',
    description: 'asd'
  }, {
    count: 1,
    a: (...chunks) => <a>{chunks}</a>
  })
  `,
    `
  intl.formatMessage({
    defaultMessage: '{count, plural, one {<a>#</a>} other {# more}}',
    description: 'asd'
  }, {
    ...foo,
    count: 1,
    a: (...chunks) => <a>{chunks}</a>
  })
  `,
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
    {
      code: `
        intl.formatMessage({
          defaultMessage: '{count, plural, one {#} other {# more}}',
          description: 'asd'
      })`,
      options: [],
    },
    {
      code: `
        intl.formatMessage({
          defaultMessage: '<b>foo</b>',
          description: 'asd'
      })`,
      options: [],
    },
  ],
  invalid: [
    {
      code: `
        intl.formatMessage({
          defaultMessage: '{count, plural, {#} other {# more}}',
          description: 'asd'
        }, {
          count: 1
        })`,
      errors: [
        {
          messageId: 'icuError',
          data: {
            message:
              'Error parsing ICU string: EXPECT_PLURAL_ARGUMENT_SELECTOR',
          },
        },
      ],
    },

    {
      code: `
        intl.formatMessage({
          defaultMessage: "{aDifferentKey, plur {#} other {# more}}" },
          { count: 1 }
        )`,
      errors: [
        {
          messageId: 'icuError',
          data: {message: 'Error parsing ICU string: INVALID_ARGUMENT_TYPE'},
        },
      ],
    },

    {
      code: `
        this.intl.formatMessage({
          defaultMessage: "{aDifferentKey, plur {#} other {# more}}" },
          { count: 1 }
        )`,
      errors: [
        {
          messageId: 'icuError',
          data: {message: 'Error parsing ICU string: INVALID_ARGUMENT_TYPE'},
        },
      ],
    },

    {
      code: `
        IntlStore.intl.formatMessage({
          defaultMessage: "{aDifferentKey, plur {#} other {# more}}" },
          { count: 1 }
        )`,
      errors: [
        {
          messageId: 'icuError',
          data: {message: 'Error parsing ICU string: INVALID_ARGUMENT_TYPE'},
        },
      ],
    },
  ],
})
