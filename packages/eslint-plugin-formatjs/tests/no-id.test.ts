import noId from '../src/rules/no-id';
import {ruleTester} from './util';
import {dynamicMessage, noMatch, spreadJsx, emptyFnCall} from './fixtures';
ruleTester.run('no-id', noId, {
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
  _({
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
    noMatch,
    spreadJsx,
    emptyFnCall,
  ],
  invalid: [
    {
      code: dynamicMessage,
      errors: [
        {
          message: 'Manual `id` are not allowed in message descriptor',
        },
      ],
      output: `
import {_} from '@formatjs/macro'
_({ defaultMessage, description})`,
    },
    {
      code: `
intl.formatMessage({ id: 'foo', defaultMessage: '{count, plural, one {#} other {# more}}', description: 'asd'
})`,
      errors: [
        {
          message: 'Manual `id` are not allowed in message descriptor',
        },
      ],
      output: `
intl.formatMessage({  defaultMessage: '{count, plural, one {#} other {# more}}', description: 'asd'
})`,
    },
    {
      code: `
intl.formatMessage({ id: 'bar', defaultMessage: '{aDifferentKey, plural, one {#} other {# more}}', description: 'asd'
}, {foo: 1})`,
      errors: [
        {
          message: 'Manual `id` are not allowed in message descriptor',
        },
      ],
      output: `
intl.formatMessage({  defaultMessage: '{aDifferentKey, plural, one {#} other {# more}}', description: 'asd'
}, {foo: 1})`,
    },
    {
      code: `
import {FormattedMessage} from 'react-intl'
const a = <FormattedMessage
id={id}
defaultMessage="{count, plural, one {#} other {# more}}"
/>`,
      errors: [
        {
          message: 'Manual `id` are not allowed in message descriptor',
        },
      ],
      output: `
import {FormattedMessage} from 'react-intl'
const a = <FormattedMessage

defaultMessage="{count, plural, one {#} other {# more}}"
/>`,
    },
    {
      code: `
import {FormattedMessage} from 'react-intl'
const a = (
  <FormattedMessage id="bas" defaultMessage="{count, plural, one {#} other {# more}}" values={{foo: 1}} />
)`,
      errors: [
        {
          message: 'Manual `id` are not allowed in message descriptor',
        },
      ],
      output: `
import {FormattedMessage} from 'react-intl'
const a = (
  <FormattedMessage  defaultMessage="{count, plural, one {#} other {# more}}" values={{foo: 1}} />
)`,
    },
    {
      code: `
intl.formatMessage({ id, defaultMessage: '{count, plural, one {<a>#</a>} other {# more}}', description: 'asd'
}, {
  count: 1,
})`,
      errors: [
        {
          message: 'Manual `id` are not allowed in message descriptor',
        },
      ],
      output: `
intl.formatMessage({  defaultMessage: '{count, plural, one {<a>#</a>} other {# more}}', description: 'asd'
}, {
  count: 1,
})`,
    },
  ],
});
