import enforcePlaceholders from '../rules/enforce-placeholders'
import {ruleTester} from './util'
import {dynamicMessage, noMatch, spreadJsx, emptyFnCall} from './fixtures'
ruleTester.run('enforce-placeholders', enforcePlaceholders, {
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
          defaultMessage: '{count, plural, one {#} other {# more}}',
          description: 'asd'
      })`,
      errors: [
        {
          message: 'Missing value for placeholder "count"',
        },
      ],
    },
    {
      code: `
        intl.formatMessage({
          defaultMessage: '<b>foo</b>',
          description: 'asd'
      })`,
      errors: [{message: 'Missing value for placeholder "b"'}],
    },
    {
      code: `
        intl.formatMessage({
          defaultMessage: '{aDifferentKey, plural, one {#} other {# more}}',
          description: 'asd'
      }, {foo: 1})`,
      errors: [
        {
          message: 'Missing value for placeholder "aDifferentKey"',
        },
      ],
    },
    {
      code: `
        import {FormattedMessage} from 'react-intl'
        const a = <FormattedMessage 
        defaultMessage="{count, plural, one {#} other {# more}}"
        />`,
      errors: [
        {
          message: 'Missing value for placeholder "count"',
        },
      ],
    },
    {
      code: `
        import {FormattedMessage} from 'react-intl'
        const a = <FormattedMessage 
        defaultMessage="{count, plural, one {#} other {# more}}"
        values={{foo: 1}}
        />`,
      errors: [
        {
          message: 'Missing value for placeholder "count"',
        },
      ],
    },
    {
      code: `
        import {FormattedMessage} from 'react-intl'
        const a = <FormattedMessage id="myMessage" defaultMessage="Hello {name}" values={{ notName: "Denis" }} />`,
      errors: [
        {
          message: 'Missing value for placeholder "name"',
        },
      ],
    },
    {
      code: `
        import {FormattedMessage} from 'react-intl'
        const a = <FormattedMessage defaultMessage="Hello <bold>{name}</bold>" values={{ bold: (msg) => <strong>{msg}</strong> }} />`,
      errors: [
        {
          message: 'Missing value for placeholder "name"',
        },
      ],
    },
    {
      code: `
        intl.formatMessage({
          defaultMessage: '{count, plural, one {<a>#</a>} other {# more}}',
          description: 'asd'
        }, {
          count: 1,
        })
        `,
      errors: [
        {
          message: 'Missing value for placeholder "a"',
        },
      ],
    },
    {
      code: `
      {$t({ 
        defaultMessage: "My name is {name}" 
      })}
      `,
      errors: [
        {
          message: 'Missing value for placeholder "name"',
        },
      ]
    }
  ],
})
