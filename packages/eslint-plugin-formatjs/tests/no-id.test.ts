import {name, rule} from '../rules/no-id.js'
import {dynamicMessage, emptyFnCall, noMatch, spreadJsx} from './fixtures'
import {ruleTester} from './util'
ruleTester.run(name, rule, {
  valid: [
    {
      code: `intl.formatMessage({
      defaultMessage: '{count, plural, one {#} other {# more}}',
      description: 'asd'
  }, {count: 1})`,
    },
    {
      code: `intl.formatMessage({
    defaultMessage: '{count, plural, one {#} other {# more}}',
    description: 'asd'
  }, {'count': 1})`,
    },
    {
      code: `import {FormattedMessage} from 'react-intl'
  const a = <FormattedMessage 
  defaultMessage="{count, plural, one {#} other {# more}}"
  values={{ count: 1}} />
        `,
    },
    {
      code: `import {FormattedMessage} from 'react-intl'
  const a = <FormattedMessage 
  defaultMessage="{count, plural, one {#} other {# more}} {bar}"
  values={{ 'count': 1, bar: 2}} />
        `,
    },
    {
      code: `import {defineMessages, _} from 'react-intl'
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
    },
    {
      code: `
  intl.formatMessage({
    defaultMessage: '{count, plural, one {<a>#</a>} other {# more}}',
    description: 'asd'
  }, {
    count: 1,
    a: (...chunks) => <a>{chunks}</a>
  })
  `,
    },
    {
      code: `
  intl.formatMessage({
    defaultMessage: '{count, plural, one {<a>#</a>} other {# more}}',
    description: 'asd'
  }, {
    ...foo,
    count: 1,
    a: (...chunks) => <a>{chunks}</a>
  })
  `,
    },
    noMatch,
    spreadJsx,
    emptyFnCall,
  ],
  invalid: [
    {
      code: dynamicMessage.code,
      errors: [{messageId: 'noId'}],
      output: `
import {defineMessage} from 'react-intl'
defineMessage({ defaultMessage, description})`,
    },
    {
      code: `
intl.formatMessage({ id: 'foo', defaultMessage: '{count, plural, one {#} other {# more}}', description: 'asd'
})`,
      errors: [{messageId: 'noId'}],
      output: `
intl.formatMessage({  defaultMessage: '{count, plural, one {#} other {# more}}', description: 'asd'
})`,
    },
    {
      code: `
intl.formatMessage({ id: 'bar', defaultMessage: '{aDifferentKey, plural, one {#} other {# more}}', description: 'asd'
}, {foo: 1})`,
      errors: [{messageId: 'noId'}],
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
      errors: [{messageId: 'noId'}],
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
      errors: [{messageId: 'noId'}],
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
      errors: [{messageId: 'noId'}],
      output: `
intl.formatMessage({  defaultMessage: '{count, plural, one {<a>#</a>} other {# more}}', description: 'asd'
}, {
  count: 1,
})`,
    },
  ],
})
