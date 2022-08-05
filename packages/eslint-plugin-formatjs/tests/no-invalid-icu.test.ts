import noMalformedICU from '../rules/no-invalid-icu'
import {ruleTester} from './util'
import {dynamicMessage, noMatch, spreadJsx, emptyFnCall} from './fixtures'

ruleTester.run('no-invalid-icu', noMalformedICU, {
  valid: [
    `intl.formatMessage({
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
      options: [{ignoreList: ['count']}],
    },
    {
      code: `
        intl.formatMessage({
          defaultMessage: '<b>foo</b>',
          description: 'asd'
      })`,
      options: [{ignoreList: ['b']}],
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
          message: 'Error parsing ICU string: EXPECT_PLURAL_ARGUMENT_SELECTOR',
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
          message: 'Error parsing ICU string: INVALID_ARGUMENT_TYPE',
        },
      ],
    },
  ],
})
