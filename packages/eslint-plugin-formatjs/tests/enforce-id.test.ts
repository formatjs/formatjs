import enforceId from '../rules/enforce-id';
import {ruleTester} from './util';
import {noMatch, spreadJsx, emptyFnCall} from './fixtures';
const options = [{idInterpolationPattern: '[sha512:contenthash:base64:6]'}];
ruleTester.run('enforce-id', enforceId, {
  valid: [
    {
      code: `intl.formatMessage({ id: 'j9qhn+', defaultMessage: '{count, plural, one {#} other {# more}}', description: 'asd'})`,
      options,
    },
    {
      code: `<FormattedMessage id="/e77jM" defaultMessage="{count, plural, one {#} other {# more}}" values={{foo: 1}} />`,
      options,
    },
    {code: noMatch, options},
    {code: spreadJsx, options},
    {code: emptyFnCall, options},
  ],
  invalid: [
    {
      code: `
intl.formatMessage({ id: 'foo', defaultMessage: '{count, plural, one {#} other {# more}}', description: 'asd'})`,
      errors: [
        {
          message: `"id" does not match with hash pattern [sha512:contenthash:base64:6].
Expected: j9qhn+
Actual: foo`,
        },
      ],
      options,
      output: `
intl.formatMessage({ id: 'j9qhn+', defaultMessage: '{count, plural, one {#} other {# more}}', description: 'asd'})`,
    },
    {
      code: `
intl.formatMessage({ id: 'bar', defaultMessage: '{aDifferentKey, plural, one {#} other {# more}}', description: 'asd'
}, {foo: 1})`,
      errors: [
        {
          message: `"id" does not match with hash pattern [sha512:contenthash:base64:6].
Expected: 73owpx
Actual: bar`,
        },
      ],
      options,
      output: `
intl.formatMessage({ id: '73owpx', defaultMessage: '{aDifferentKey, plural, one {#} other {# more}}', description: 'asd'
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
          message: `"id" does not match with hash pattern [sha512:contenthash:base64:6].
Expected: /e77jM
Actual: undefined`,
        },
      ],
      options,
      output: `
import {FormattedMessage} from 'react-intl'
const a = <FormattedMessage
id="/e77jM"
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
          message: `"id" does not match with hash pattern [sha512:contenthash:base64:6].
Expected: /e77jM
Actual: bas`,
        },
      ],
      options,
      output: `
import {FormattedMessage} from 'react-intl'
const a = (
  <FormattedMessage id="/e77jM" defaultMessage="{count, plural, one {#} other {# more}}" values={{foo: 1}} />
)`,
    },
    {
      code: `
import {FormattedMessage} from 'react-intl'
const a = (
  <FormattedMessage defaultMessage="{count, plural, one {#} other {# more}}" values={{foo: 1}} />
)`,
      errors: [
        {
          message: `"id" does not match with hash pattern [sha512:contenthash:base64:6].
Expected: /e77jM
Actual: undefined`,
        },
      ],
      options,
      output: `
import {FormattedMessage} from 'react-intl'
const a = (
  <FormattedMessage defaultMessage="{count, plural, one {#} other {# more}}" id="/e77jM" values={{foo: 1}} />
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
          message: `"id" does not match with hash pattern [sha512:contenthash:base64:6].
Expected: UoHSIG
Actual: undefined`,
        },
      ],
      options,
      output: `
intl.formatMessage({ id: 'UoHSIG', defaultMessage: '{count, plural, one {<a>#</a>} other {# more}}', description: 'asd'
}, {
  count: 1,
})`,
    },
  ],
});
