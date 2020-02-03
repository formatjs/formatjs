import * as plugin from '../src';
import {RuleTester} from 'eslint';
import {noMatch, spreadJsx, emptyFnCall, dynamicMessage} from './fixtures';

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      modules: true,
      jsx: true,
    },
  },
});

const rules = (plugin as plugin.Plugin).rules;

ruleTester.run('enforce-description', rules['enforce-description'], {
  valid: [
    `import {_} from '@formatjs/macro'
_({
    defaultMessage: '{count, plural, one {#} other {# more}}',
    description: 'asd'
})`,
    `intl.formatMessage({
    defaultMessage: '{count, plural, one {#} other {# more}}',
    description: 'asd'
})`,
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
  ],
  invalid: [
    {
      code: `
            import {_} from '@formatjs/macro'
            _({
                defaultMessage: '{count, plural, one {#} other {# more}}'
            })`,
      errors: [
        {
          message: '`description` has to be specified in message descriptor',
        },
      ],
    },
    {
      code: `
            intl.formatMessage({
                defaultMessage: '{count, plural, one {#} other {# more}}'
            })`,
      errors: [
        {
          message: '`description` has to be specified in message descriptor',
        },
      ],
    },
    {
      code: `
            import {defineMessages} from 'react-intl'
            defineMessages({
              foo: {
                defaultMessage: '{count2, plural, one {#} other {# more}}'
              }
            })`,
      errors: [
        {
          message: '`description` has to be specified in message descriptor',
        },
      ],
    },
    {
      code: `
            import {FormattedMessage} from 'react-intl'
            const a = <FormattedMessage defaultMessage="{count2, plural, one {#} other {# more}}"/>`,
      errors: [
        {
          message: '`description` has to be specified in message descriptor',
        },
      ],
    },
    {
      code: `
            import {FormattedMessage} from 'react-intl'
            const a = <FormattedMessage defaultMessage="{count2, plural, one {#} other {# more}}"></FormattedMessage>`,
      errors: [
        {
          message: '`description` has to be specified in message descriptor',
        },
      ],
    },
  ],
});

ruleTester.run('enforce-default-message', rules['enforce-default-message'], {
  valid: [
    `import {_} from '@formatjs/macro'
_({
    defaultMessage: 'this is default message',
    description: 'asd'
})`,
    `intl.formatMessage({
    defaultMessage: 'this is default message',
    description: 'asd'
})`,
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
  ],
  invalid: [
    {
      code: `
            import {_} from '@formatjs/macro'
            _({
                description: 'this is default message'
            })`,
      errors: [
        {
          message: '`defaultMessage` has to be specified in message descriptor',
        },
      ],
    },
    {
      code: `
            intl.formatMessage({
                description: 'this is description'
            })`,
      errors: [
        {
          message: '`defaultMessage` has to be specified in message descriptor',
        },
      ],
    },
    {
      code: `
            import {defineMessages} from 'react-intl'
            defineMessages({
              foo: {
                description: 'this is description'
              }
            })`,
      errors: [
        {
          message: '`defaultMessage` has to be specified in message descriptor',
        },
      ],
    },
    {
      code: `
            import {FormattedMessage} from 'react-intl'
            const a = <FormattedMessage description="this is description"/>`,
      errors: [
        {
          message: '`defaultMessage` has to be specified in message descriptor',
        },
      ],
    },
    {
      code: `
            import {FormattedMessage} from 'react-intl'
            const a = <FormattedMessage description="this is description"></FormattedMessage>`,
      errors: [
        {
          message: '`defaultMessage` has to be specified in message descriptor',
        },
      ],
    },
  ],
});

ruleTester.run('no-camel-case', rules['no-camel-case'], {
  valid: [
    `import {_} from '@formatjs/macro'
_({
    defaultMessage: 'a {placeholder}',
    description: 'asd'
})`,
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
  ],
  invalid: [
    {
      code: `
            import {_} from '@formatjs/macro'
            _({
                defaultMessage: 'a {placeHolder}'
            })`,
      errors: [
        {
          message: 'Camel case arguments are not allowed',
        },
      ],
    },
  ],
});

ruleTester.run('no-multiple-plurals', rules['no-multiple-plurals'], {
  valid: [
    `import {_} from '@formatjs/macro'
_({
    defaultMessage: 'a {placeholder}',
    description: 'asd'
})`,
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
  ],
  invalid: [
    {
      code: `
            import {_} from '@formatjs/macro'
            _({
                defaultMessage: '{p1, plural, one{one}} {p2, plural, one{two}}'
            })`,
      errors: [
        {
          message: 'Cannot specify more than 1 plural rules',
        },
      ],
    },
    {
      code: `
            import {_} from '@formatjs/macro'
            _({
                defaultMessage: '{p1, plural, one{{p2, plural, one{two}}}}'
            })`,
      errors: [
        {
          message: 'Cannot specify more than 1 plural rules',
        },
      ],
    },
  ],
});

ruleTester.run('enforce-plural-rules', rules['enforce-plural-rules'], {
  valid: [
    {
      code: `import {_} from '@formatjs/macro'
_({
    defaultMessage: '{count, plural, one {#} other {# more}}',
    description: 'asd'
})`,
      options: [
        {
          one: true,
        },
      ],
    },
    {
      code: `import {_} from '@formatjs/macro'
_({
    defaultMessage: '{count, plural, one {#} other {# more}}',
    description: 'asd'
})`,
      options: [
        {
          other: true,
        },
      ],
    },
    {
      code: `import {_} from '@formatjs/macro'
_({
    defaultMessage: '{count, plural, one {#} other {# more}}',
    description: 'asd'
})`,
      options: [
        {
          one: true,
          other: true,
          zero: false,
        },
      ],
    },
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
  ],
  invalid: [
    {
      code: `
            import {_} from '@formatjs/macro'
            _({
                defaultMessage: '{count, plural, one {#} other {# more}}'
            })`,
      options: [
        {
          one: false,
        },
      ],
      errors: [
        {
          message: 'Plural rule "one" is forbidden',
        },
      ],
    },
    {
      code: `
            import {_} from '@formatjs/macro'
            _({
                defaultMessage: '{count, plural, one {#}}'
            })`,
      options: [
        {
          one: true,
          other: true,
        },
      ],
      errors: [
        {
          message: 'Missing plural rule "other"',
        },
      ],
    },
  ],
});

ruleTester.run('enforce-placeholders', rules['enforce-placeholders'], {
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
  ],
});

ruleTester.run('blacklist-elements', rules['blacklist-elements'], {
  valid: [
    {
      code: `import {_} from '@formatjs/macro'
_({
    defaultMessage: '{count, plural, one {#} other {# more}}'
})`,
      options: [['selectordinal']],
    },
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
  ],
  invalid: [
    {
      code: `
            import {_} from '@formatjs/macro'
            _({
                defaultMessage: '{count, selectordinal, offset:1 one {#} other {# more}}'
            })`,
      options: [['selectordinal']],
      errors: [
        {
          message: 'selectordinal element is blacklisted',
        },
      ],
    },
  ],
});

ruleTester.run('no-offset', rules['no-offset'], {
  valid: [
    `import {_} from '@formatjs/macro'
_({
    defaultMessage: '{count, plural, one {#} other {# more}}'
})`,
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
  ],
  invalid: [
    {
      code: `
            import {_} from '@formatjs/macro'
            _({
                defaultMessage: '{count, plural, offset:1 one {#} other {# more}}'
            })`,
      errors: [
        {
          message: 'offset are not allowed in plural rules',
        },
      ],
    },
    {
      code: `
            import {_} from '@formatjs/macro'
            _({
                defaultMessage: '{count, plural, offset:1 one {#} other {# more}'
            })`,
      errors: [
        {
          message: 'Expected "=", "}", or argName but end of input found.',
        },
      ],
    },
  ],
});

ruleTester.run(
  'supported-datetime-skeleton',
  rules['supported-datetime-skeleton'],
  {
    valid: [
      `import {_} from '@formatjs/macro'
_({
    defaultMessage: '{ts, date, ::yyyyMMdd}'
})`,
      dynamicMessage,
      noMatch,
      spreadJsx,
      emptyFnCall,
    ],
    invalid: [
      {
        code: `
            import {_} from '@formatjs/macro'
            _({
                defaultMessage: '{ts, date, ::yQQQHm}'
            })`,
        errors: [
          {
            message: '`q/Q` (quarter) patterns are not supported',
          },
        ],
      },
      {
        code: `
            import {_} from '@formatjs/macro'
            _({
                defaultMessage: '{ts, date, ::DFg}'
            })`,
        errors: [
          {
            message:
              '`D/F/g` (day) patterns are not supported, use `d` instead',
          },
        ],
      },
    ],
  }
);
