import {name, rule, Option} from '../rules/enforce-id'
import {ruleTester} from './util'
import {noMatch, spreadJsx, emptyFnCall} from './fixtures'
const options: [Option] = [
  {idInterpolationPattern: '[sha512:contenthash:base64:6]'},
]
ruleTester.run(name, rule, {
  valid: [
    {
      code: `intl.formatMessage({ id: 'j9qhn+', defaultMessage: '{count, plural, one {#} other {# more}}', description: 'asd'})`,
      options,
    },
    {
      code: `intl.$t({ id: 'j9qhn+', defaultMessage: '{count, plural, one {#} other {# more}}', description: 'asd'})`,
      options,
    },
    {
      code: `<FormattedMessage id="/e77jM" defaultMessage="{count, plural, one {#} other {# more}}" values={{foo: 1}} />`,
      options,
    },
    `<FormattedMessage id="manual id" defaultMessage="{count, plural, one {#} other {# more}}" values={{foo: 1}} />`,
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
          messageId: 'enforceIdMatching',
          data: {
            idInterpolationPattern: '[sha512:contenthash:base64:6]',
            expected: 'j9qhn+',
            actual: 'foo',
          },
        },
      ],
      options,
      output: `
intl.formatMessage({ id: 'j9qhn+', defaultMessage: '{count, plural, one {#} other {# more}}', description: 'asd'})`,
    },
    {
      code: `
intl.$t({ id: 'foo', defaultMessage: '{count, plural, one {#} other {# more}}', description: 'asd'})`,
      errors: [
        {
          messageId: 'enforceIdMatching',
          data: {
            idInterpolationPattern: '[sha512:contenthash:base64:6]',
            expected: 'j9qhn+',
            actual: 'foo',
          },
        },
      ],
      options,
      output: `
intl.$t({ id: 'j9qhn+', defaultMessage: '{count, plural, one {#} other {# more}}', description: 'asd'})`,
    },
    {
      code: `
intl.formatMessage({defaultMessage: '{count, plural, one {#} other {# more}}', description: 'asd'})`,
      errors: [
        {
          messageId: 'enforceId',
        },
      ],
    },
    {
      code: `
intl.formatMessage({defaultMessage: '{count, plural, one {#} other {# more}}', description: 'asd'})`,
      errors: [
        {
          messageId: 'enforceIdMatching',
          data: {
            idInterpolationPattern: '[sha512:contenthash:base64:6]',
            expected: 'j9qhn+',
            actual: 'undefined',
          },
        },
      ],
      options,
      output: `
intl.formatMessage({defaultMessage: '{count, plural, one {#} other {# more}}', id: 'j9qhn+', description: 'asd'})`,
    },
    {
      code: `
intl.formatMessage({ id: 'bar', defaultMessage: '{aDifferentKey, plural, one {#} other {# more}}', description: 'asd'
}, {foo: 1})`,
      errors: [
        {
          messageId: 'enforceIdMatching',
          data: {
            idInterpolationPattern: '[sha512:contenthash:base64:6]',
            expected: '73owpx',
            actual: 'bar',
          },
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
          messageId: 'enforceIdMatching',
          data: {
            idInterpolationPattern: '[sha512:contenthash:base64:6]',
            expected: '/e77jM',
            actual: 'undefined',
          },
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
          messageId: 'enforceIdMatching',
          data: {
            idInterpolationPattern: '[sha512:contenthash:base64:6]',
            expected: '/e77jM',
            actual: 'bas',
          },
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
          messageId: 'enforceIdMatching',
          data: {
            idInterpolationPattern: '[sha512:contenthash:base64:6]',
            expected: '/e77jM',
            actual: 'undefined',
          },
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
          messageId: 'enforceIdMatching',
          data: {
            idInterpolationPattern: '[sha512:contenthash:base64:6]',
            expected: 'UoHSIG',
            actual: 'undefined',
          },
        },
      ],
      options,
      output: `
intl.formatMessage({ id: 'UoHSIG', defaultMessage: '{count, plural, one {<a>#</a>} other {# more}}', description: 'asd'
}, {
  count: 1,
})`,
    },
    {
      code: `
import { defineMessages } from 'react-intl'

defineMessages({ example: { defaultMessage: 'example' } })`,
      errors: [
        {
          messageId: 'enforceIdMatching',
          data: {
            idInterpolationPattern: '[sha512:contenthash:base64:6]',
            expected: 'O7Eu2j',
            actual: 'undefined',
          },
        },
      ],
      options,
      output: `
import { defineMessages } from 'react-intl'

defineMessages({ example: { defaultMessage: 'example', id: 'O7Eu2j' } })`,
    },
  ],
})

const optionsWithWhitelist: [Option] = [
  {
    idInterpolationPattern: '[sha512:contenthash:base64:6]',
    idWhitelist: ['\\.', '^payment_.*'],
  },
]
ruleTester.run(name, rule, {
  valid: [
    {
      options: optionsWithWhitelist,
      code: `
import { defineMessages } from 'react-intl'
defineMessages({ example: { defaultMessage: 'example1', id: 'my.custom.id' } })
defineMessages({ example: { defaultMessage: 'example2', id: 'payment_string' } })`,
    },
  ],
  invalid: [
    {
      code: `
intl.formatMessage({defaultMessage: '{count, plural, one {#} other {# more}}', description: 'asd'})`,
      errors: [
        {
          messageId: 'enforceIdMatchingAllowlisted',
          data: {
            idInterpolationPattern: '[sha512:contenthash:base64:6]',
            expected: 'j9qhn+',
            actual: 'undefined',
            idWhitelist: '"/\\./i", "/^payment_.*/i"',
          },
        },
      ],
      options: optionsWithWhitelist,
      output: `
intl.formatMessage({defaultMessage: '{count, plural, one {#} other {# more}}', id: 'j9qhn+', description: 'asd'})`,
    },
    {
      code: `
intl.formatMessage({defaultMessage: "{count, plural, one {#} other {# more}}", description: "asd"})`,
      errors: [
        {
          messageId: 'enforceIdMatchingAllowlisted',
          data: {
            idInterpolationPattern: '[sha512:contenthash:base64:6]',
            expected: 'j9qhn+',
            actual: 'undefined',
            idWhitelist: '"/\\./i", "/^payment_.*/i"',
          },
        },
      ],
      options: optionsWithWhitelist,
      output: `
intl.formatMessage({defaultMessage: "{count, plural, one {#} other {# more}}", id: 'j9qhn+', description: "asd"})`,
    },
    {
      code: `
import { defineMessages } from 'react-intl'
defineMessages({ example: { defaultMessage: 'example1', id: 'payment_string' }, example2: { defaultMessage: 'example2' }  })`,
      options: optionsWithWhitelist,
      errors: [
        {
          messageId: 'enforceIdMatchingAllowlisted',
          data: {
            idInterpolationPattern: '[sha512:contenthash:base64:6]',
            expected: 'FnMvk8',
            actual: 'undefined',
            idWhitelist: '"/\\./i", "/^payment_.*/i"',
          },
        },
      ],
      output: `
import { defineMessages } from 'react-intl'
defineMessages({ example: { defaultMessage: 'example1', id: 'payment_string' }, example2: { defaultMessage: 'example2', id: 'FnMvk8' }  })`,
    },
  ],
})
