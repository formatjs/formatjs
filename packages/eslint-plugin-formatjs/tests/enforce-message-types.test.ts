import {rule} from '#packages/eslint-plugin-formatjs/rules/enforce-message-types.js'
import {ruleTester} from '#packages/eslint-plugin-formatjs/tests/util.js'

ruleTester.run('enforce-message-types', rule, {
  valid: [
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: "intl.$t({defaultMessage: 'Hello'})",
    },
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: 'import type {NoMessageValues} from "@formatjs/intl"; intl.formatMessage<NoMessageValues>({defaultMessage: "Hello"}, {})',
    },
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: 'import type {NoMessageValues} from "@formatjs/intl"; intl.formatMessage<NoMessageValues, React.ReactNode>({defaultMessage: "Hello"})',
    },
    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat.Unrelated('{n}')",
    },
    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "import IntlMessageFormat from 'intl-messageformat'; function f(IntlMessageFormat: any) {new IntlMessageFormat('{n}')}",
    },
    {
      filename: 'test.ts',
      code: "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat('{n}')",
    },
    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "class IntlMessageFormat {}; new IntlMessageFormat('{n}')",
    },
    {
      filename: 'test.ts',
      code: "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat<{readonly n: number | bigint}>('{n, number}')",
    },
    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat(dynamic)",
    },
    {
      filename: 'test.ts',
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage({defaultMessage: '{n, number}'})",
    },
    {
      filename: 'test.js',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage({defaultMessage: '{n, number}'})",
    },
    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "function defineMessage(x: unknown) {return x}; defineMessage({defaultMessage: '{n}'})",
    },
    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "import {defineMessage, defineMessages} from 'react-intl';\nfunction f(defineMessage: Function) {defineMessage({defaultMessage: '{n}'})}",
    },
    {
      filename: 'test.ts',
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage({defaultMessage: '{n}'})",
    },
    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage({defaultMessage: dynamic})",
    },
    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessages({...other})",
    },
    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage({defaultMessage: change`{n}`})",
    },
    {
      filename: 'test.ts',
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage<{readonly n: number | bigint}>({defaultMessage: '{n, number}'})",
    },
    {
      filename: 'test.ts',
      code: "import {defineMessage, defineMessages} from 'react-intl';\nimport type {MessageTag, MessageValue} from \"react-intl\";\ndefineMessage<{readonly b: MessageTag; readonly name: MessageValue}>({defaultMessage: '<b>{name}</b>'})",
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: "intl.$t<{}>({defaultMessage: 'Hello'})",
      output: "intl.$t({defaultMessage: 'Hello'})",
      errors: [{messageId: 'contract'}],
    },
    ...['@formatjs/svelte-intl', 'vue-intl'].map(module => ({
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `import {defineMessage} from '${module}';\ndefineMessage({defaultMessage: '{n, number}'})`,
      output: `import {defineMessage} from '${module}';\ndefineMessage<{ readonly "n": number | bigint }>({defaultMessage: '{n, number}'})`,
      errors: [{messageId: 'contract'}],
    })),

    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat('{n, number}', 'en')",
      output:
        "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat<{ readonly \"n\": number | bigint }>('{n, number}', 'en')",
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "import {IntlMessageFormat as Message} from 'intl-messageformat'; new Message(\"'{fake}' <b>{name}</b>\")",
      output:
        'import {IntlMessageFormat as Message} from \'intl-messageformat\';\nimport type {MessageTag, MessageValue} from "intl-messageformat"; new Message<{ readonly "b": MessageTag; readonly "name": MessageValue }>("\'{fake}\' <b>{name}</b>")',
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "import * as intl from 'intl-messageformat'; new intl.IntlMessageFormat('<b>Hello</b>', 'en', undefined, {ignoreTag: true})",
      output:
        "import * as intl from 'intl-messageformat';\nimport type {NoMessageValues} from \"intl-messageformat\"; new intl.IntlMessageFormat<NoMessageValues>('<b>Hello</b>', 'en', undefined, {ignoreTag: true})",
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      filename: 'test.ts',
      code: "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat</* @formatjs-generated */ {}>('{n, number}')",
      output:
        "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat<{ readonly \"n\": number | bigint }>('{n, number}')",
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      filename: 'test.ts',
      code: "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat<{readonly n: string}>('{n, number}')",
      errors: [
        {
          messageId: 'contract',
        },
      ],
      output:
        "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat<{ readonly \"n\": number | bigint }>('{n, number}')",
    },
    {
      filename: 'test.ts',
      code: "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat<{}>('Hello', 'en', undefined, options)",
      errors: [
        {
          messageId: 'dynamic',
        },
      ],
    },
    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage?.<{}>({defaultMessage: 'Hello'})",
      output:
        "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage?.({defaultMessage: 'Hello'})",
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage({defaultMessage: '{n, plural, offset:1 one {#} other {{n, number}}}'})",
      output:
        "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage<{ readonly \"n\": number | bigint }>({defaultMessage: '{n, plural, offset:1 one {#} other {{n, number}}}'})",
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage({defaultMessage: \"'{fake}' <b>{name}</b> <br/>\"},)",
      output:
        'import {defineMessage, defineMessages} from \'react-intl\';\nimport type {MessageTag, MessageValue} from "react-intl";\ndefineMessage<{ readonly "b": MessageTag; readonly "name": MessageValue }>({defaultMessage: "\'{fake}\' <b>{name}</b> <br/>"},)',
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      filename: 'test.ts',
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage</* @formatjs-generated */ { readonly \"n\": number | bigint }>({defaultMessage: '{date, date}'})",
      output:
        "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage<{ readonly \"date\": number | Date }>({defaultMessage: '{date, date}'})",
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessages({'a b': {defaultMessage: 'Hello'}, nested: {defaultMessage: '{s, select, other {{n, selectordinal, one {#} other {#}}}}'}})",
      output:
        'import {defineMessage, defineMessages} from \'react-intl\';\nimport type {NoMessageValues} from "react-intl";\ndefineMessages<{ readonly "a b": NoMessageValues; readonly "nested": { readonly "n": number | bigint; readonly "s": string } }>({\'a b\': {defaultMessage: \'Hello\'}, nested: {defaultMessage: \'{s, select, other {{n, selectordinal, one {#} other {#}}}}\'}})',
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "import {defineMessage as message} from '@formatjs/intl'; message<{}>({defaultMessage: 'Hello'})",
      output:
        "import {defineMessage as message} from '@formatjs/intl'; message({defaultMessage: 'Hello'})",
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "import * as intl from 'react-intl/server'; intl.defineMessage({defaultMessage: '{n, number, ::currency/USD}'})",
      output:
        "import * as intl from 'react-intl/server'; intl.defineMessage<{ readonly \"n\": number | bigint }>({defaultMessage: '{n, number, ::currency/USD}'})",
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage({defaultMessage: '{bad'})",
      errors: [
        {
          messageId: 'invalid',
        },
      ],
    },
    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage({defaultMessage: '{n, number} <n>x</n>'})",
      errors: [
        {
          messageId: 'invalid',
        },
      ],
    },
    {
      filename: 'test.ts',
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage<{readonly n: string}>({defaultMessage: '{n, number}'})",
      errors: [
        {
          messageId: 'contract',
        },
      ],
      output:
        "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage<{ readonly \"n\": number | bigint }>({defaultMessage: '{n, number}'})",
    },
    {
      filename: 'test.ts',
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage</* @formatjs-generated */ {}>({defaultMessage: dynamic})",
      errors: [
        {
          messageId: 'dynamic',
        },
      ],
    },
  ],
})

ruleTester.run('enforce-message-types inline', rule, {
  valid: [
    {
      filename: 'test.ts',
      code: "formatMessage({defaultMessage: '{n, number}'}, {n: 2})",
    },
    {
      filename: 'test.js',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "formatMessage({defaultMessage: '{n, number}'}, {n: 2})",
    },
    {
      filename: 'test.ts',
      code: "formatMessage<{readonly n: number | bigint}>({defaultMessage: '{n, number}'}, {n: 2})",
    },
    {
      filename: 'test.ts',
      code: "formatMessage<{readonly n: number | bigint}, React.ReactNode>({defaultMessage: '{n, number}'}, {n: 2})",
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
      code: "formatMessage({...descriptor, defaultMessage: '{n}'}, {n: 2})",
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
      code: 'import type {MessageTag, MessageValue} from "react-intl";\nformatMessage<{ readonly "b": MessageTag; readonly "name": MessageValue }, React.ReactNode>({defaultMessage: "\'{fake}\' <b>{name}</b>"}, values)',
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
        'formatMessage<{ readonly "n": number | bigint }>({defaultMessage: \'{n, number}\'}, {n: 2})',
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
        'intl.$t<{ readonly "n": number | bigint }>({defaultMessage: \'{n, number}\'}, {n: 2})',
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
        'intl.formatMessage?.<{ readonly "n": number | bigint }>({defaultMessage: \'{n, number}\'}, {n: 2})',
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
        'formatMessage<{ readonly "n": number | bigint }, React.ReactNode>({defaultMessage: \'{n, number}\'}, {n: 2})',
    },
    {
      filename: 'test.ts',
      code: "formatMessage<Rich>({defaultMessage: '{n, number}'}, {n: 2})",
      errors: [
        {
          messageId: 'contract',
        },
      ],
      output:
        'formatMessage<{ readonly "n": number | bigint }>({defaultMessage: \'{n, number}\'}, {n: 2})',
    },
    {
      filename: 'test.ts',
      code: "formatMessage<{readonly n: string}>({defaultMessage: '{n, number}'}, {n: 2})",
      errors: [
        {
          messageId: 'contract',
        },
      ],
      output:
        'formatMessage<{ readonly "n": number | bigint }>({defaultMessage: \'{n, number}\'}, {n: 2})',
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
        'import type {MessageTag, MessageValue} from "react-intl";\nformatMessage<{ readonly "b": MessageTag; readonly "name": MessageValue }>({defaultMessage: "\'{fake}\' <b>{name}</b>"}, values)',
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
        'import {useIntl} from \'react-intl\';\nimport type {MessageTag} from "react-intl"; intl.formatMessage<{ readonly "b": MessageTag }>({defaultMessage: \'<b>Hello</b>\'}, values)',
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
        'import type {NoMessageValues} from "@formatjs/intl";\nformatMessage<NoMessageValues>({defaultMessage: \'<b>Hello</b>\'}, {}, {ignoreTag: true})',
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
        'translate<{ readonly "n": number | bigint }>({defaultMessage: \'{n, number}\'}, values)',
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
    {
      filename: 'test.ts',
      code: "intl.$t</* @formatjs-generated */ {readonly n: number | bigint}, React.ReactNode>({defaultMessage: '{n, number}'}, {n: 2})",
      output:
        'intl.$t<{ readonly "n": number | bigint }, React.ReactNode>({defaultMessage: \'{n, number}\'}, {n: 2})',
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
  ],
})

ruleTester.run('enforce-message-types ignoreList', rule, {
  valid: [
    {
      filename: 'test.ts',
      code: 'import type {MessageTag, MessageValue} from "@formatjs/intl";\nintl.$t<{ readonly "b"?: MessageTag; readonly "count"?: number | bigint; readonly "extra"?: MessageValue }>({defaultMessage: \'<b>{count, number}</b>\'})',
      options: [
        {
          ignoreList: ['b', 'count', 'extra'],
        },
      ],
    },
    {
      filename: 'test.ts',
      code: 'import {defineMessage} from \'react-intl\';\nimport type {MessageTag, MessageValue} from "react-intl"; defineMessage<{ readonly "b"?: MessageTag; readonly "count"?: number | bigint; readonly "extra"?: MessageValue }>({defaultMessage: \'<b>{count, number}</b>\'})',
      options: [
        {
          ignoreList: ['b', 'count', 'extra'],
        },
      ],
    },
    {
      filename: 'test.ts',
      code: 'import IntlMessageFormat from \'intl-messageformat\';\nimport type {MessageTag, MessageValue} from "intl-messageformat"; new IntlMessageFormat<{ readonly "b"?: MessageTag; readonly "count"?: number | bigint; readonly "extra"?: MessageValue }>(\'<b>{count, number}</b>\')',
      options: [
        {
          ignoreList: ['b', 'count', 'extra'],
        },
      ],
    },
  ],
  invalid: [
    {
      code: "intl.$t({defaultMessage: '<b>{count, number}</b>'})",
      output:
        'import type {MessageTag, MessageValue} from "@formatjs/intl";\nintl.$t<{ readonly "b"?: MessageTag; readonly "count"?: number | bigint; readonly "extra"?: MessageValue }>({defaultMessage: \'<b>{count, number}</b>\'})',
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
          ignoreList: ['b', 'count', 'extra'],
        },
      ],
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      code: "import {defineMessage} from 'react-intl'; defineMessage({defaultMessage: '<b>{count, number}</b>'})",
      output:
        'import {defineMessage} from \'react-intl\';\nimport type {MessageTag, MessageValue} from "react-intl"; defineMessage<{ readonly "b"?: MessageTag; readonly "count"?: number | bigint; readonly "extra"?: MessageValue }>({defaultMessage: \'<b>{count, number}</b>\'})',
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
          ignoreList: ['b', 'count', 'extra'],
        },
      ],
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      code: "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat('<b>{count, number}</b>')",
      output:
        'import IntlMessageFormat from \'intl-messageformat\';\nimport type {MessageTag, MessageValue} from "intl-messageformat"; new IntlMessageFormat<{ readonly "b"?: MessageTag; readonly "count"?: number | bigint; readonly "extra"?: MessageValue }>(\'<b>{count, number}</b>\')',
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
          ignoreList: ['b', 'count', 'extra'],
        },
      ],
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
  ],
})
ruleTester.run('enforce-message-types hoisted imports', rule, {
  valid: [
    {
      filename: 'test.ts',
      code: "import type {MessageTag as Tag} from 'react-intl'; intl.$t<{ readonly \"b\": Tag }, React.ReactNode>({defaultMessage: '<b>Hello</b>'}, values)",
    },
    {
      filename: 'test.ts',
      code: 'import type {MessageTag as MessageTag1} from "@formatjs/intl";\ntype MessageTag = string; intl.$t<{ readonly "b": MessageTag1 }, RichOutput>({defaultMessage: \'<b>Hello</b>\'}, values)',
    },
    {
      filename: 'test.ts',
      code: 'import type {MessageTag} from \'react-intl\';\nimport type {MessageTag as MessageTag1} from "react-intl"; function f<MessageTag>() { return intl.$t<{ readonly "b": MessageTag1 }, React.ReactNode>({defaultMessage: \'<b>Hello</b>\'}, values) }',
    },
    {
      filename: 'test.ts',
      code: '\'use client\';\nimport type {MessageTag} from "@formatjs/intl"; intl.$t<{ readonly "b": MessageTag }>({defaultMessage: \'<b>Hello</b>\'}, values)',
    },
    {
      filename: 'test.ts',
      code: 'import type {MessageTag} from "@formatjs/intl";\nintl.$t<{ readonly "b": MessageTag }, React.ReactNode>({defaultMessage: \'<b>Hello</b>\'}, values)',
    },
    {
      filename: 'test.ts',
      code: "import {defineMessage} from 'react-intl'; defineMessage<{ readonly \"n\": number | bigint }>({defaultMessage: '{n, number}'})",
    },
  ],
  invalid: [
    {
      code: "import type {MessageTag as Tag} from 'react-intl'; intl.$t<Old, React.ReactNode>({defaultMessage: '<b>Hello</b>'}, values)",
      output:
        "import type {MessageTag as Tag} from 'react-intl'; intl.$t<{ readonly \"b\": Tag }, React.ReactNode>({defaultMessage: '<b>Hello</b>'}, values)",
      filename: 'test.ts',
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      code: "type MessageTag = string; intl.$t<Old, RichOutput>({defaultMessage: '<b>Hello</b>'}, values)",
      output:
        'import type {MessageTag as MessageTag1} from "@formatjs/intl";\ntype MessageTag = string; intl.$t<{ readonly "b": MessageTag1 }, RichOutput>({defaultMessage: \'<b>Hello</b>\'}, values)',
      filename: 'test.ts',
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      code: "import type {MessageTag} from 'react-intl'; function f<MessageTag>() { return intl.$t<Old, React.ReactNode>({defaultMessage: '<b>Hello</b>'}, values) }",
      output:
        'import type {MessageTag} from \'react-intl\';\nimport type {MessageTag as MessageTag1} from "react-intl"; function f<MessageTag>() { return intl.$t<{ readonly "b": MessageTag1 }, React.ReactNode>({defaultMessage: \'<b>Hello</b>\'}, values) }',
      filename: 'test.ts',
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      code: "'use client'; intl.$t<Old>({defaultMessage: '<b>Hello</b>'}, values)",
      output:
        '\'use client\';\nimport type {MessageTag} from "@formatjs/intl"; intl.$t<{ readonly "b": MessageTag }>({defaultMessage: \'<b>Hello</b>\'}, values)',
      filename: 'test.ts',
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      code: 'intl.$t</* @formatjs-generated */ {readonly b: import("@formatjs/intl").MessageTag}, React.ReactNode>({defaultMessage: \'<b>Hello</b>\'}, values)',
      output:
        'import type {MessageTag} from "@formatjs/intl";\nintl.$t<{ readonly "b": MessageTag }, React.ReactNode>({defaultMessage: \'<b>Hello</b>\'}, values)',
      filename: 'test.ts',
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      code: "import {defineMessage} from 'react-intl'; defineMessage<{readonly old: string}>({defaultMessage: '{n, number}'})",
      output:
        "import {defineMessage} from 'react-intl'; defineMessage<{ readonly \"n\": number | bigint }>({defaultMessage: '{n, number}'})",
      options: [
        {
          generateTypes: true,
        },
      ],
      filename: 'test.ts',
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
  ],
})

ruleTester.run('catalog annotations', rule, {
  valid: [
    {
      filename: 'test.ts',
      code: "import {defineMessages, type MessageDescriptor} from 'react-intl'; const messages: Record<string, MessageDescriptor> = defineMessages({count: {defaultMessage: '{n, number}'}})",
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: "import {defineMessages, type MessageDescriptor} from 'react-intl'; export const messages: Record<string, MessageDescriptor> = defineMessages({count: {defaultMessage: '{n, number}'}})",
      output:
        'import {defineMessages} from \'react-intl\';\nimport type {TypedMessageDescriptor} from "react-intl"; export const messages: { readonly "count": TypedMessageDescriptor<{ readonly "n": number | bigint }> } = defineMessages<{ readonly "count": { readonly "n": number | bigint } }>({count: {defaultMessage: \'{n, number}\'}})',
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: "import {defineMessages as dm, type MessageDescriptor as MD, type TypedMessageDescriptor as TD} from '@formatjs/intl'; const messages: Readonly<Record<'count', MD>> = dm<{readonly count: {readonly n: number | bigint}}>({count: {defaultMessage: '{n, number}'}})",
      output:
        'import {defineMessages as dm, type TypedMessageDescriptor as TD} from \'@formatjs/intl\'; const messages: { readonly "count": TD<{ readonly "n": number | bigint }> } = dm<{ readonly "count": { readonly "n": number | bigint } }>({count: {defaultMessage: \'{n, number}\'}})',
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: "import {defineMessages, type MessageDescriptor, type TypedMessageDescriptor} from 'react-intl'; const messages: {readonly count?: MessageDescriptor} & {readonly count: TypedMessageDescriptor<{readonly n: string}>} = defineMessages<{readonly count: {readonly n: string}}>({count: {defaultMessage: '{n, number}'}})",
      output:
        'import {defineMessages, type TypedMessageDescriptor} from \'react-intl\'; const messages: { readonly "count": TypedMessageDescriptor<{ readonly "n": number | bigint }> } = defineMessages<{ readonly "count": { readonly "n": number | bigint } }>({count: {defaultMessage: \'{n, number}\'}})',
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: "import {defineMessages} from 'react-intl'; const messages: CustomCatalog = defineMessages({count: {defaultMessage: '{n, number}'}})",
      errors: [{messageId: 'annotation'}],
    },
  ],
})

ruleTester.run('refresh writable contracts', rule, {
  valid: [],
  invalid: [
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: "intl.formatMessage<{n: number | bigint}>({defaultMessage: '{n, number}'}, {n: 1})",
      output: `intl.formatMessage<{ readonly "n": number | bigint }>({defaultMessage: '{n, number}'}, {n: 1})`,
      errors: [{messageId: 'contract'}],
    },
  ],
})

ruleTester.run('descriptor metadata generic', rule, {
  valid: [],
  invalid: [
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: "import {defineMessage} from 'react-intl'; defineMessage<{n: string}, Descriptor>({defaultMessage: '{n, number}'})",
      output: `import {defineMessage} from 'react-intl'; defineMessage<{ readonly "n": number | bigint }, Descriptor>({defaultMessage: '{n, number}'})`,
      errors: [{messageId: 'contract'}],
    },
  ],
})

ruleTester.run('existing catalog migration', rule, {
  valid: [
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `import {defineMessages, type MessageValuesOf} from 'react-intl'; import {shared, Keys} from './messages'; defineMessages<{readonly [Keys.Count]: MessageValuesOf<typeof shared.count>}>({[Keys.Count]: shared.count})`,
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `import {defineMessages, type MessageDescriptor} from 'react-intl'; type Catalog = {count: MessageDescriptor}; const messages: Catalog = defineMessages({count: {defaultMessage: '{n, number}'}})`,
      output: `import {defineMessages} from 'react-intl';\nimport type {TypedMessageDescriptor} from "react-intl";  const messages: { readonly "count": TypedMessageDescriptor<{ readonly "n": number | bigint }> } = defineMessages<{ readonly "count": { readonly "n": number | bigint } }>({count: {defaultMessage: '{n, number}'}})`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `import {defineMessages} from 'react-intl'; import {shared, Keys} from './messages'; defineMessages<Keys>({[Keys.Count]: shared.count, [Keys.Hello]: {defaultMessage: 'Hello'}})`,
      output: `import {defineMessages} from 'react-intl'; import {shared, Keys} from './messages';\nimport type {MessageValuesOf, NoMessageValues} from "react-intl"; defineMessages<{ readonly [Keys.Count]: MessageValuesOf<typeof shared.count>; readonly [Keys.Hello]: NoMessageValues }>({[Keys.Count]: shared.count, [Keys.Hello]: {defaultMessage: 'Hello'}})`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `import {defineMessage} from 'react-intl'; const descriptor = {defaultMessage: '{n, number}'}; defineMessage(descriptor)`,
      output: `import {defineMessage} from 'react-intl'; const descriptor = {defaultMessage: '{n, number}'}; defineMessage<{ readonly "n": number | bigint }>(descriptor)`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      code: `const descriptor = {defaultMessage: '{n, number}'}; descriptor.defaultMessage = '{name}'; intl.$t<{n: number}>(descriptor, {n: 1})`,
      errors: [{messageId: 'dynamic'}],
    },
  ],
})

ruleTester.run('safe catalog type cleanup', rule, {
  valid: [],
  invalid: [
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `import {defineMessages, type MessageDescriptor} from 'react-intl'; const messages: Record<string, MessageDescriptor | undefined> = defineMessages({hello: {defaultMessage: 'Hello'}})`,
      output: `import {defineMessages} from 'react-intl';\nimport type {TypedMessageDescriptor} from "react-intl"; const messages: { readonly "hello": TypedMessageDescriptor } = defineMessages({hello: {defaultMessage: 'Hello'}})`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `import {defineMessages, type MessageDescriptor} from 'react-intl'; export type Catalog = {hello: MessageDescriptor}; const messages: Catalog = defineMessages({hello: {defaultMessage: 'Hello'}})`,
      output: `import {defineMessages, type MessageDescriptor} from 'react-intl';\nimport type {TypedMessageDescriptor} from "react-intl"; export type Catalog = {hello: MessageDescriptor}; const messages: { readonly "hello": TypedMessageDescriptor } = defineMessages({hello: {defaultMessage: 'Hello'}})`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `import {defineMessages} from 'react-intl'; import type {Keys, Unrelated} from './types'; type LocalKeys = Keys; defineMessages<LocalKeys>({hello: {defaultMessage: 'Hello'}}); export type Keep = Unrelated`,
      output: `import {defineMessages} from 'react-intl'; import type {Unrelated} from './types';  defineMessages({hello: {defaultMessage: 'Hello'}}); export type Keep = Unrelated`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `import {defineMessages} from 'react-intl'; import type {Keys} from './types'; defineMessages<Keys>({hello: {defaultMessage: 'Hello'}}); let other: Keys`,
      output: `import {defineMessages} from 'react-intl'; import type {Keys} from './types'; defineMessages({hello: {defaultMessage: 'Hello'}}); let other: Keys`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `const descriptor = {defaultMessage: '{n, number}'}; intl.$t(descriptor, {n: 1})`,
      output: `const descriptor = {defaultMessage: '{n, number}'}; intl.$t<{ readonly "n": number | bigint }>(descriptor, {n: 1})`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      code: `import {defineMessage} from 'react-intl'; const descriptor = {defaultMessage: '{n, number}'}; mutate(descriptor); defineMessage<{n: number}>(descriptor)`,
      errors: [{messageId: 'dynamic'}],
    },
    {
      filename: 'test.ts',
      code: `import {defineMessage} from 'react-intl'; let descriptor = {defaultMessage: '{n, number}'}; defineMessage<{n: number}>(descriptor)`,
      errors: [{messageId: 'dynamic'}],
    },
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `import {defineMessages} from 'react-intl'; type Catalog = Catalog; const messages: Catalog = defineMessages({hello: {defaultMessage: 'Hello'}})`,
      errors: [{messageId: 'annotation'}],
    },
  ],
})

ruleTester.run('computed annotated catalogs', rule, {
  valid: [
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `import {defineMessages, type TypedMessageDescriptor} from 'react-intl'; import {Keys} from './keys'; const messages: {readonly [Keys.Hello]: TypedMessageDescriptor} = defineMessages({[Keys.Hello]: {defaultMessage: 'Hello'}})`,
    },
  ],
  invalid: [],
})

const sharedCatalogBefore = `import {defineMessages, type MessageDescriptor, type TypedMessageDescriptor} from 'react-intl'; const a: Record<string, MessageDescriptor> = defineMessages({hello: {defaultMessage: 'Hello'}}); const b: Record<string, MessageDescriptor> = defineMessages({bye: {defaultMessage: 'Bye'}})`
const sharedCatalogFirstPass = `import {defineMessages, type MessageDescriptor, type TypedMessageDescriptor} from 'react-intl'; const a: { readonly "hello": TypedMessageDescriptor } = defineMessages({hello: {defaultMessage: 'Hello'}}); const b: Record<string, MessageDescriptor> = defineMessages({bye: {defaultMessage: 'Bye'}})`
const sharedCatalogFixed = `import {defineMessages, type TypedMessageDescriptor} from 'react-intl'; const a: { readonly "hello": TypedMessageDescriptor } = defineMessages({hello: {defaultMessage: 'Hello'}}); const b: { readonly "bye": TypedMessageDescriptor } = defineMessages({bye: {defaultMessage: 'Bye'}})`

ruleTester.run('shared imports across fixes', rule, {
  valid: [
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: sharedCatalogFixed,
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: sharedCatalogBefore,
      output: sharedCatalogFirstPass,
      errors: [{messageId: 'contract'}, {messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: sharedCatalogFirstPass,
      output: sharedCatalogFixed,
      errors: [{messageId: 'contract'}],
    },
  ],
})

ruleTester.run('shared descriptor and mixed error catalogs', rule, {
  valid: [],
  invalid: [
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `import {defineMessage as message, defineMessages} from 'react-intl'; const descriptor = {id: 'count', defaultMessage: '{count, number}'}; message(descriptor); defineMessages({count: descriptor}); intl.$t(descriptor, {count: 2})`,
      output: `import {defineMessage as message, defineMessages} from 'react-intl'; const descriptor = {id: 'count', defaultMessage: '{count, number}'}; message<{ readonly "count": number | bigint }>(descriptor); defineMessages<{ readonly "count": { readonly "count": number | bigint } }>({count: descriptor}); intl.$t<{ readonly "count": number | bigint }>(descriptor, {count: 2})`,
      errors: [
        {messageId: 'contract'},
        {messageId: 'contract'},
        {messageId: 'contract'},
      ],
    },
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `import {defineMessages} from 'react-intl'; import {shared} from './messages'; import type {UploadError} from './errors'; const messages = defineMessages<UploadError['kind']>({Denied: {defaultMessage: 'Access denied'}, TooMany: shared.tooMany, Help: shared.help}); export function getMessage(error: UploadError) {return messages[error.kind]}`,
      output: `import {defineMessages} from 'react-intl'; import {shared} from './messages'; import type {UploadError} from './errors';\nimport type {NoMessageValues, MessageValuesOf} from "react-intl"; const messages = defineMessages<{ readonly "Denied": NoMessageValues; readonly "TooMany": MessageValuesOf<typeof shared.tooMany>; readonly "Help": MessageValuesOf<typeof shared.help> }>({Denied: {defaultMessage: 'Access denied'}, TooMany: shared.tooMany, Help: shared.help}); export function getMessage(error: UploadError) {return messages[error.kind]}`,
      errors: [{messageId: 'contract'}],
    },
  ],
})

ruleTester.run('annotated standalone descriptors', rule, {
  valid: [
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `import {defineMessage, type TypedMessageDescriptor} from 'react-intl'; export const message: TypedMessageDescriptor<{ readonly n: number | bigint }> = defineMessage<{ readonly n: number | bigint }>({defaultMessage: '{n, number}'})`,
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `import {defineMessage, type MessageDescriptor} from 'react-intl'; export const message: MessageDescriptor = defineMessage({defaultMessage: '{n, number}'})`,
      output: `import {defineMessage} from 'react-intl';\nimport type {TypedMessageDescriptor} from "react-intl"; export const message: TypedMessageDescriptor<{ readonly "n": number | bigint }> = defineMessage<{ readonly "n": number | bigint }>({defaultMessage: '{n, number}'})`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `import {defineMessage, type MessageDescriptor, type TypedMessageDescriptor} from '@formatjs/intl'; type Descriptor = Readonly<MessageDescriptor>; export const message: Descriptor = defineMessage<{readonly n: string}>({defaultMessage: '{n, number}'})`,
      output: `import {defineMessage, type TypedMessageDescriptor} from '@formatjs/intl';  export const message: TypedMessageDescriptor<{ readonly "n": number | bigint }> = defineMessage<{ readonly "n": number | bigint }>({defaultMessage: '{n, number}'})`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `import {defineMessage, type TypedMessageDescriptor} from 'react-intl'; export const message: TypedMessageDescriptor<{readonly n: string}> = defineMessage<{readonly n: string}>({defaultMessage: '{n, number}'})`,
      output: `import {defineMessage, type TypedMessageDescriptor} from 'react-intl'; export const message: TypedMessageDescriptor<{ readonly "n": number | bigint }> = defineMessage<{ readonly "n": number | bigint }>({defaultMessage: '{n, number}'})`,
      errors: [{messageId: 'contract'}],
    },
  ],
})

ruleTester.run('omit empty helper contracts', rule, {
  valid: [
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: "import {defineMessage, defineMessages} from 'react-intl'; defineMessage({defaultMessage: 'Hello'}); defineMessages({hello: {defaultMessage: 'Hello'}})",
    },
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: "import {defineMessage, type NoMessageValues} from 'react-intl'; defineMessage<NoMessageValues, {id: string; defaultMessage: string}>({id: 'hello', defaultMessage: 'Hello'})",
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: "import {defineMessage} from 'react-intl'; defineMessage<{}>({defaultMessage: 'Hello'})",
      output:
        "import {defineMessage} from 'react-intl'; defineMessage({defaultMessage: 'Hello'})",
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: "import {defineMessages} from 'react-intl'; defineMessages<{hello: {}}>({hello: {defaultMessage: 'Hello'}})",
      output:
        "import {defineMessages} from 'react-intl'; defineMessages({hello: {defaultMessage: 'Hello'}})",
      errors: [{messageId: 'contract'}],
    },
  ],
})

ruleTester.run('lint-compatible empty contracts', rule, {
  valid: [
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `import {defineMessages, type NoMessageValues as Empty} from 'react-intl'; defineMessages<{readonly plain: Empty; readonly count: {readonly n: number | bigint}}>({plain: {defaultMessage: 'Hello'}, count: {defaultMessage: '{n, number}'}})`,
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `import {defineMessages} from 'react-intl'; type NoMessageValues = string; defineMessages<{plain: {}; count: {n: number}}>({plain: {defaultMessage: 'Hello'}, count: {defaultMessage: '{n, number}'}})`,
      output: `import {defineMessages} from 'react-intl';\nimport type {NoMessageValues as NoMessageValues1} from "react-intl"; type NoMessageValues = string; defineMessages<{ readonly "plain": NoMessageValues1; readonly "count": { readonly "n": number | bigint } }>({plain: {defaultMessage: 'Hello'}, count: {defaultMessage: '{n, number}'}})`,
      errors: [{messageId: 'contract'}],
    },
    {
      filename: 'test.ts',
      options: [{generateTypes: true}],
      code: `import {defineMessage, type NoMessageValues} from 'react-intl'; defineMessage<NoMessageValues>({defaultMessage: 'Hello'})`,
      output: `import {defineMessage} from 'react-intl'; defineMessage({defaultMessage: 'Hello'})`,
      errors: [{messageId: 'contract'}],
    },
  ],
})
