import {
  name,
  rule,
} from '#packages/eslint-plugin-formatjs/rules/enforce-message-types.js'
import {ruleTester} from '#packages/eslint-plugin-formatjs/tests/util.js'

const prefix = "import {defineMessage, defineMessages} from 'react-intl';\n"
const options = [{generateTypes: true}]
const marker = '/* @formatjs-generated */'
ruleTester.run(name, rule, {
  valid: [
    {
      filename: 'test.ts',
      options,
      code: "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat.Unrelated('{n}')",
    },
    {
      filename: 'test.ts',
      options,
      code: "import IntlMessageFormat from 'intl-messageformat'; function f(IntlMessageFormat: any) {new IntlMessageFormat('{n}')}",
    },

    {
      filename: 'test.ts',
      code: "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat('{n}')",
    },
    {
      filename: 'test.ts',
      options,
      code: "class IntlMessageFormat {}; new IntlMessageFormat('{n}')",
    },
    {
      filename: 'test.ts',
      code: `import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat<${marker} {n: number | bigint}>('{n, number}')`,
    },
    {
      filename: 'test.ts',
      options,
      code: "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat(dynamic)",
    },

    {
      filename: 'test.ts',
      code: prefix + "defineMessage({defaultMessage: '{n, number}'})",
    },
    {
      filename: 'test.js',
      options,
      code: prefix + "defineMessage({defaultMessage: '{n, number}'})",
    },
    {
      filename: 'test.ts',
      options,
      code: "function defineMessage(x: unknown) {return x}; defineMessage({defaultMessage: '{n}'})",
    },
    {
      filename: 'test.ts',
      options,
      code:
        prefix +
        "function f(defineMessage: Function) {defineMessage({defaultMessage: '{n}'})}",
    },
    {
      filename: 'test.ts',
      options,
      code:
        prefix +
        "defineMessage<{defaultMessage: string}>({defaultMessage: '{n}'})",
    },
    {
      filename: 'test.ts',
      options,
      code: prefix + 'defineMessage({defaultMessage: dynamic})',
    },
    {filename: 'test.ts', options, code: prefix + 'defineMessages({...other})'},
    {
      filename: 'test.ts',
      options,
      code: prefix + 'defineMessage({defaultMessage: change`{n}`})',
    },
    {
      filename: 'test.ts',
      code:
        prefix +
        `defineMessage<${marker} {n: number | bigint}>({defaultMessage: '{n, number}'}, {typed: true})`,
    },
    {
      filename: 'test.ts',
      code:
        prefix +
        `defineMessage<${marker} {b: import('react-intl').MessageTag; name: import('react-intl').MessageValue}>({defaultMessage: '<b>{name}</b>'}, {typed: true})`,
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      options,
      code: "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat('{n, number}', 'en')",
      output: `import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat<${marker} { "n": number | bigint }>('{n, number}', 'en')`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options,
      code: `import {IntlMessageFormat as Message} from 'intl-messageformat'; new Message("'{fake}' <b>{name}</b>")`,
      output: `import {IntlMessageFormat as Message} from 'intl-messageformat'; new Message<${marker} { "b": import("intl-messageformat").MessageTag; "name": import("intl-messageformat").MessageValue }>("'{fake}' <b>{name}</b>")`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options,
      code: "import * as intl from 'intl-messageformat'; new intl.IntlMessageFormat('<b>Hello</b>', 'en', undefined, {ignoreTag: true})",
      output: `import * as intl from 'intl-messageformat'; new intl.IntlMessageFormat<${marker} {}>('<b>Hello</b>', 'en', undefined, {ignoreTag: true})`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      code: `import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat<${marker} {}>('{n, number}')`,
      output: `import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat<${marker} { "n": number | bigint }>('{n, number}')`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      code: "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat<{n: string}>('{n, number}')",
      errors: [{messageId: 'manual'}],
    },
    {
      filename: 'test.ts',
      code: "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat<{}>('Hello', 'en', undefined, options)",
      errors: [{messageId: 'dynamic'}],
    },

    {
      filename: 'test.ts',
      options,
      code: prefix + "defineMessage?.({defaultMessage: 'Hello'})",
      output:
        prefix +
        `defineMessage?.<${marker} {}>({defaultMessage: 'Hello'}, {typed: true})`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options,
      code:
        prefix +
        "defineMessage({defaultMessage: '{n, plural, offset:1 one {#} other {{n, number}}}'})",
      output:
        prefix +
        `defineMessage<${marker} { "n": number | bigint }>({defaultMessage: '{n, plural, offset:1 one {#} other {{n, number}}}'}, {typed: true})`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options,
      code:
        prefix +
        `defineMessage({defaultMessage: "'{fake}' <b>{name}</b> <br/>"},)`,
      output:
        prefix +
        `defineMessage<${marker} { "b": import("react-intl").MessageTag; "name": import("react-intl").MessageValue }>({defaultMessage: "'{fake}' <b>{name}</b> <br/>"}, {typed: true})`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      code:
        prefix +
        `defineMessage<${marker} { "n": number | bigint }>({defaultMessage: '{date, date}'}, {typed: true})`,
      output:
        prefix +
        `defineMessage<${marker} { "date": number | Date }>({defaultMessage: '{date, date}'}, {typed: true})`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options,
      code:
        prefix +
        "defineMessages({'a b': {defaultMessage: 'Hello'}, nested: {defaultMessage: '{s, select, other {{n, selectordinal, one {#} other {#}}}}'}})",
      output:
        prefix +
        `defineMessages<${marker} { "a b": {}; "nested": { "n": number | bigint; "s": string } }>({'a b': {defaultMessage: 'Hello'}, nested: {defaultMessage: '{s, select, other {{n, selectordinal, one {#} other {#}}}}'}}, {typed: true})`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options,
      code: "import {defineMessage as message} from '@formatjs/intl'; message({defaultMessage: 'Hello'})",
      output: `import {defineMessage as message} from '@formatjs/intl'; message<${marker} {}>({defaultMessage: 'Hello'}, {typed: true})`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options,
      code: "import * as intl from 'react-intl/server'; intl.defineMessage({defaultMessage: '{n, number, ::currency/USD}'})",
      output: `import * as intl from 'react-intl/server'; intl.defineMessage<${marker} { "n": number | bigint }>({defaultMessage: '{n, number, ::currency/USD}'}, {typed: true})`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options,
      code: prefix + "defineMessage({defaultMessage: '{bad'})",
      errors: [{messageId: 'invalid'}],
    },
    {
      filename: 'test.ts',
      options,
      code: prefix + "defineMessage({defaultMessage: '{n, number} <n>x</n>'})",
      errors: [{messageId: 'invalid'}],
    },
    {
      filename: 'test.ts',
      code:
        prefix +
        "defineMessage<{n: string}>({defaultMessage: '{n, number}'}, {typed: true})",
      errors: [{messageId: 'manual'}],
    },
    {
      filename: 'test.ts',
      code:
        prefix +
        `defineMessage<${marker} {}>({defaultMessage: dynamic}, {typed: true})`,
      errors: [{messageId: 'dynamic'}],
    },
  ],
})

ruleTester.run('enforce-message-types inline', rule, {
  valid: [
    {
      filename: 'test.ts',
      code: "formatMessage({defaultMessage: '{n, number}'})",
    },
    {
      filename: 'test.js',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "formatMessage({defaultMessage: '{n, number}'})",
    },
    {
      filename: 'test.ts',
      code: "formatMessage</* @formatjs-generated */ {n: number | bigint}>({defaultMessage: '{n, number}'}, {n: 2})",
    },
    {
      filename: 'test.ts',
      code: "formatMessage<{n: number | bigint}, React.ReactNode>({defaultMessage: '{n, number}'}, {n: 2})",
    },
    {
      filename: 'test.ts',
      code: "formatMessage({id: 'only-id'})",
      options: [
        {
          generateTypes: true,
        },
      ],
    },
    {
      filename: 'test.ts',
      code: 'formatMessage({defaultMessage: dynamic})',
      options: [
        {
          generateTypes: true,
        },
      ],
    },
    {
      filename: 'test.ts',
      code: "formatMessage({...descriptor, defaultMessage: '{n}'})",
      options: [
        {
          generateTypes: true,
        },
      ],
    },
    {
      filename: 'test.ts',
      code: "formatMessage({defaultMessage: '{n, number}'} satisfies MessageDescriptor, values)",
      options: [
        {
          generateTypes: true,
        },
      ],
    },
    {
      filename: 'test.ts',
      code: "formatMessage({defaultMessage: '{n, number}'} as MessageDescriptor, values)",
      options: [
        {
          generateTypes: true,
        },
      ],
    },
    {
      filename: 'test.ts',
      code: "formatMessage({defaultMessage: '{n, number}'}, values, options)",
      options: [
        {
          generateTypes: true,
        },
      ],
    },
    {
      filename: 'test.ts',
      code: 'formatMessage</* @formatjs-generated */ { "b": import("react-intl").MessageTag; "name": import("react-intl").MessageValue }, React.ReactNode>({defaultMessage: "\'{fake}\' <b>{name}</b>"}, values)',
      options: [
        {
          moduleSource: 'react-intl',
        },
      ],
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      code: "formatMessage({defaultMessage: '{n, number}'}, {n: 2})",
      errors: [
        {
          messageId: 'contract',
        },
      ],
      output:
        'formatMessage</* @formatjs-generated */ { "n": number | bigint }>({defaultMessage: \'{n, number}\'}, {n: 2})',
      options: [
        {
          generateTypes: true,
        },
      ],
    },
    {
      filename: 'test.ts',
      code: "intl.$t({defaultMessage: '{n, number}'}, {n: 2})",
      errors: [
        {
          messageId: 'contract',
        },
      ],
      output:
        'intl.$t</* @formatjs-generated */ { "n": number | bigint }>({defaultMessage: \'{n, number}\'}, {n: 2})',
      options: [
        {
          generateTypes: true,
        },
      ],
    },
    {
      filename: 'test.ts',
      code: "intl.formatMessage?.({defaultMessage: '{n, number}'}, {n: 2})",
      errors: [
        {
          messageId: 'contract',
        },
      ],
      output:
        'intl.formatMessage?.</* @formatjs-generated */ { "n": number | bigint }>({defaultMessage: \'{n, number}\'}, {n: 2})',
      options: [
        {
          generateTypes: true,
        },
      ],
    },
    {
      filename: 'test.ts',
      code: "formatMessage</* @formatjs-generated */ {}, React.ReactNode>({defaultMessage: '{n, number}'}, {n: 2})",
      errors: [
        {
          messageId: 'contract',
        },
      ],
      output:
        'formatMessage</* @formatjs-generated */ { "n": number | bigint }, React.ReactNode>({defaultMessage: \'{n, number}\'}, {n: 2})',
    },
    {
      filename: 'test.ts',
      code: "formatMessage<Rich>({defaultMessage: '{n, number}'}, {n: 2})",
      errors: [
        {
          messageId: 'manual',
        },
      ],
    },
    {
      filename: 'test.ts',
      code: "formatMessage<{n: string}>({defaultMessage: '{n, number}'}, {n: 2})",
      errors: [
        {
          messageId: 'manual',
        },
      ],
    },
    {
      filename: 'test.ts',
      code: 'formatMessage</* @formatjs-generated */ {}>(dynamic)',
      errors: [
        {
          messageId: 'dynamic',
        },
      ],
    },
    {
      filename: 'test.ts',
      code: 'formatMessage</* @formatjs-generated */ {}>({defaultMessage: dynamic})',
      errors: [
        {
          messageId: 'dynamic',
        },
      ],
    },
    {
      filename: 'test.ts',
      code: 'formatMessage({defaultMessage: "\'{fake}\' <b>{name}</b>"}, values)',
      errors: [
        {
          messageId: 'contract',
        },
      ],
      output:
        'formatMessage</* @formatjs-generated */ { "b": import("react-intl").MessageTag; "name": import("react-intl").MessageValue }>({defaultMessage: "\'{fake}\' <b>{name}</b>"}, values)',
      options: [
        {
          generateTypes: true,
          moduleSource: 'react-intl',
        },
      ],
    },
    {
      filename: 'test.ts',
      code: "import {useIntl} from 'react-intl'; intl.formatMessage({defaultMessage: '<b>Hello</b>'}, values)",
      errors: [
        {
          messageId: 'contract',
        },
      ],
      output:
        'import {useIntl} from \'react-intl\'; intl.formatMessage</* @formatjs-generated */ { "b": import("react-intl").MessageTag }>({defaultMessage: \'<b>Hello</b>\'}, values)',
      options: [
        {
          generateTypes: true,
        },
      ],
    },
    {
      filename: 'test.ts',
      code: "formatMessage({defaultMessage: '<b>Hello</b>'}, {}, {ignoreTag: true})",
      errors: [
        {
          messageId: 'contract',
        },
      ],
      output:
        "formatMessage</* @formatjs-generated */ {}>({defaultMessage: '<b>Hello</b>'}, {}, {ignoreTag: true})",
      options: [
        {
          generateTypes: true,
        },
      ],
    },
    {
      filename: 'test.ts',
      code: "translate({defaultMessage: '{n, number}'}, values)",
      errors: [
        {
          messageId: 'contract',
        },
      ],
      output:
        'translate</* @formatjs-generated */ { "n": number | bigint }>({defaultMessage: \'{n, number}\'}, values)',
      options: [
        {
          generateTypes: true,
        },
      ],
      settings: {
        formatjs: {
          additionalFunctionNames: ['translate'],
        },
      },
    },
    {
      filename: 'test.ts',
      code: "formatMessage({defaultMessage: '{broken'})",
      errors: [
        {
          messageId: 'invalid',
        },
      ],
      options: [
        {
          generateTypes: true,
        },
      ],
    },
  ],
})
