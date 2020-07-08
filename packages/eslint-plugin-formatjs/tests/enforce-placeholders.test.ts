import enforcePlaceholders from '../rules/enforce-placeholders';
import {ruleTester} from './util';
import {dynamicMessage, noMatch, spreadJsx, emptyFnCall} from './fixtures';
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
  ],
});
