import * as plugin from '../src';
import {RuleTester} from 'eslint';
import {noMatch, emptyFnCall} from './fixtures';

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
    noMatch,
  ],
  invalid: [
    {
      code: emptyFnCall,
      errors: [
        {
          messageId: 'description',
        },
      ],
    },
    {
      code: `
            import {_} from '@formatjs/macro'
            _({
                defaultMessage: '{count, plural, one {#} other {# more}}'
            })`,
      errors: [
        {
          messageId: 'description',
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
          messageId: 'description',
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
          messageId: 'description',
        },
      ],
    },
    {
      code: `
            import {FormattedMessage} from 'react-intl'
            const a = <FormattedMessage defaultMessage="{count2, plural, one {#} other {# more}}"/>`,
      errors: [
        {
          messageId: 'description',
        },
      ],
    },
    {
      code: `
            import {FormattedMessage} from 'react-intl'
            const a = <FormattedMessage defaultMessage="{count2, plural, one {#} other {# more}}"></FormattedMessage>`,
      errors: [
        {
          messageId: 'description',
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
    noMatch,
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
    noMatch,
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
    noMatch,
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

ruleTester.run('blacklist-elements', rules['blacklist-elements'], {
  valid: [
    {
      code: `import {_} from '@formatjs/macro'
_({
    defaultMessage: '{count, plural, one {#} other {# more}}'
})`,
      options: [['selectordinal']],
    },
    noMatch,
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
    noMatch,
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
          messageId: 'noOffset',
        },
      ],
    },
  ],
});
