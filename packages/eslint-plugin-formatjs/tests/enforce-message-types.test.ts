import {rule} from '#packages/eslint-plugin-formatjs/rules/enforce-message-types.js'
import {ruleTester} from '#packages/eslint-plugin-formatjs/tests/util.js'

ruleTester.run('enforce-message-types', rule, {
  valid: [
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
      code: "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat<{n: number | bigint}>('{n, number}')",
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
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage<{defaultMessage: string}>({defaultMessage: '{n}'})",
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
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage<{n: number | bigint}>({defaultMessage: '{n, number}'}, {typed: true})",
    },
    {
      filename: 'test.ts',
      code: "import {defineMessage, defineMessages} from 'react-intl';\nimport type {MessageTag, MessageValue} from \"react-intl\";\ndefineMessage<{b: MessageTag; name: MessageValue}>({defaultMessage: '<b>{name}</b>'}, {typed: true})",
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      options: [
        {
          generateTypes: true,
        },
      ],
      code: "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat('{n, number}', 'en')",
      output:
        "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat<{ \"n\": number | bigint }>('{n, number}', 'en')",
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
        'import {IntlMessageFormat as Message} from \'intl-messageformat\';\nimport type {MessageTag, MessageValue} from "intl-messageformat"; new Message<{ "b": MessageTag; "name": MessageValue }>("\'{fake}\' <b>{name}</b>")',
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
        "import * as intl from 'intl-messageformat'; new intl.IntlMessageFormat<{}>('<b>Hello</b>', 'en', undefined, {ignoreTag: true})",
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
        "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat<{ \"n\": number | bigint }>('{n, number}')",
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      filename: 'test.ts',
      code: "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat<{n: string}>('{n, number}')",
      errors: [
        {
          messageId: 'contract',
        },
      ],
      output:
        "import IntlMessageFormat from 'intl-messageformat'; new IntlMessageFormat<{ \"n\": number | bigint }>('{n, number}')",
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
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage?.({defaultMessage: 'Hello'})",
      output:
        "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage?.<{}>({defaultMessage: 'Hello'}, {typed: true})",
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
        "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage<{ \"n\": number | bigint }>({defaultMessage: '{n, plural, offset:1 one {#} other {{n, number}}}'}, {typed: true})",
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
        'import {defineMessage, defineMessages} from \'react-intl\';\nimport type {MessageTag, MessageValue} from "react-intl";\ndefineMessage<{ "b": MessageTag; "name": MessageValue }>({defaultMessage: "\'{fake}\' <b>{name}</b> <br/>"}, {typed: true})',
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      filename: 'test.ts',
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage</* @formatjs-generated */ { \"n\": number | bigint }>({defaultMessage: '{date, date}'}, {typed: true})",
      output:
        "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage<{ \"date\": number | Date }>({defaultMessage: '{date, date}'}, {typed: true})",
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
        'import {defineMessage, defineMessages} from \'react-intl\';\ndefineMessages<{ "a b": {}; "nested": { "n": number | bigint; "s": string } }>({\'a b\': {defaultMessage: \'Hello\'}, nested: {defaultMessage: \'{s, select, other {{n, selectordinal, one {#} other {#}}}}\'}}, {typed: true})',
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
      code: "import {defineMessage as message} from '@formatjs/intl'; message({defaultMessage: 'Hello'})",
      output:
        "import {defineMessage as message} from '@formatjs/intl'; message<{}>({defaultMessage: 'Hello'}, {typed: true})",
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
        "import * as intl from 'react-intl/server'; intl.defineMessage<{ \"n\": number | bigint }>({defaultMessage: '{n, number, ::currency/USD}'}, {typed: true})",
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
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage<{n: string}>({defaultMessage: '{n, number}'}, {typed: true})",
      errors: [
        {
          messageId: 'contract',
        },
      ],
      output:
        "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage<{ \"n\": number | bigint }>({defaultMessage: '{n, number}'}, {typed: true})",
    },
    {
      filename: 'test.ts',
      code: "import {defineMessage, defineMessages} from 'react-intl';\ndefineMessage</* @formatjs-generated */ {}>({defaultMessage: dynamic}, {typed: true})",
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
      code: "formatMessage<{n: number | bigint}>({defaultMessage: '{n, number}'}, {n: 2})",
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
      code: 'import type {MessageTag, MessageValue} from "react-intl";\nformatMessage<{ "b": MessageTag; "name": MessageValue }, React.ReactNode>({defaultMessage: "\'{fake}\' <b>{name}</b>"}, values)',
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
        'formatMessage<{ "n": number | bigint }>({defaultMessage: \'{n, number}\'}, {n: 2})',
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
        'intl.$t<{ "n": number | bigint }>({defaultMessage: \'{n, number}\'}, {n: 2})',
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
        'intl.formatMessage?.<{ "n": number | bigint }>({defaultMessage: \'{n, number}\'}, {n: 2})',
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
        'formatMessage<{ "n": number | bigint }, React.ReactNode>({defaultMessage: \'{n, number}\'}, {n: 2})',
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
        'formatMessage<{ "n": number | bigint }>({defaultMessage: \'{n, number}\'}, {n: 2})',
    },
    {
      filename: 'test.ts',
      code: "formatMessage<{n: string}>({defaultMessage: '{n, number}'}, {n: 2})",
      errors: [
        {
          messageId: 'contract',
        },
      ],
      output:
        'formatMessage<{ "n": number | bigint }>({defaultMessage: \'{n, number}\'}, {n: 2})',
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
        'import type {MessageTag, MessageValue} from "react-intl";\nformatMessage<{ "b": MessageTag; "name": MessageValue }>({defaultMessage: "\'{fake}\' <b>{name}</b>"}, values)',
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
        'import {useIntl} from \'react-intl\';\nimport type {MessageTag} from "react-intl"; intl.formatMessage<{ "b": MessageTag }>({defaultMessage: \'<b>Hello</b>\'}, values)',
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
        "formatMessage<{}>({defaultMessage: '<b>Hello</b>'}, {}, {ignoreTag: true})",
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
        'translate<{ "n": number | bigint }>({defaultMessage: \'{n, number}\'}, values)',
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
      code: "intl.$t</* @formatjs-generated */ {n: number | bigint}, React.ReactNode>({defaultMessage: '{n, number}'}, {n: 2})",
      output:
        'intl.$t<{ "n": number | bigint }, React.ReactNode>({defaultMessage: \'{n, number}\'}, {n: 2})',
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
      code: 'import type {MessageTag, MessageValue} from "@formatjs/intl";\nintl.$t<{ "b"?: MessageTag; "count"?: number | bigint; "extra"?: MessageValue }>({defaultMessage: \'<b>{count, number}</b>\'})',
      options: [
        {
          ignoreList: ['b', 'count', 'extra'],
        },
      ],
    },
    {
      filename: 'test.ts',
      code: 'import {defineMessage} from \'react-intl\';\nimport type {MessageTag, MessageValue} from "react-intl"; defineMessage<{ "b"?: MessageTag; "count"?: number | bigint; "extra"?: MessageValue }>({defaultMessage: \'<b>{count, number}</b>\'}, {typed: true})',
      options: [
        {
          ignoreList: ['b', 'count', 'extra'],
        },
      ],
    },
    {
      filename: 'test.ts',
      code: 'import IntlMessageFormat from \'intl-messageformat\';\nimport type {MessageTag, MessageValue} from "intl-messageformat"; new IntlMessageFormat<{ "b"?: MessageTag; "count"?: number | bigint; "extra"?: MessageValue }>(\'<b>{count, number}</b>\')',
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
        'import type {MessageTag, MessageValue} from "@formatjs/intl";\nintl.$t<{ "b"?: MessageTag; "count"?: number | bigint; "extra"?: MessageValue }>({defaultMessage: \'<b>{count, number}</b>\'})',
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
        'import {defineMessage} from \'react-intl\';\nimport type {MessageTag, MessageValue} from "react-intl"; defineMessage<{ "b"?: MessageTag; "count"?: number | bigint; "extra"?: MessageValue }>({defaultMessage: \'<b>{count, number}</b>\'}, {typed: true})',
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
        'import IntlMessageFormat from \'intl-messageformat\';\nimport type {MessageTag, MessageValue} from "intl-messageformat"; new IntlMessageFormat<{ "b"?: MessageTag; "count"?: number | bigint; "extra"?: MessageValue }>(\'<b>{count, number}</b>\')',
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
      code: "import type {MessageTag as Tag} from 'react-intl'; intl.$t<{ \"b\": Tag }, React.ReactNode>({defaultMessage: '<b>Hello</b>'}, values)",
    },
    {
      filename: 'test.ts',
      code: 'import type {MessageTag as MessageTag1} from "@formatjs/intl";\ntype MessageTag = string; intl.$t<{ "b": MessageTag1 }, RichOutput>({defaultMessage: \'<b>Hello</b>\'}, values)',
    },
    {
      filename: 'test.ts',
      code: 'import type {MessageTag} from \'react-intl\';\nimport type {MessageTag as MessageTag1} from "react-intl"; function f<MessageTag>() { return intl.$t<{ "b": MessageTag1 }, React.ReactNode>({defaultMessage: \'<b>Hello</b>\'}, values) }',
    },
    {
      filename: 'test.ts',
      code: '\'use client\';\nimport type {MessageTag} from "@formatjs/intl"; intl.$t<{ "b": MessageTag }>({defaultMessage: \'<b>Hello</b>\'}, values)',
    },
    {
      filename: 'test.ts',
      code: 'import type {MessageTag} from "@formatjs/intl";\nintl.$t<{ "b": MessageTag }, React.ReactNode>({defaultMessage: \'<b>Hello</b>\'}, values)',
    },
    {
      filename: 'test.ts',
      code: "import {defineMessage} from 'react-intl'; defineMessage<{ \"n\": number | bigint }>({defaultMessage: '{n, number}'}, {typed: true})",
    },
  ],
  invalid: [
    {
      code: "import type {MessageTag as Tag} from 'react-intl'; intl.$t<Old, React.ReactNode>({defaultMessage: '<b>Hello</b>'}, values)",
      output:
        "import type {MessageTag as Tag} from 'react-intl'; intl.$t<{ \"b\": Tag }, React.ReactNode>({defaultMessage: '<b>Hello</b>'}, values)",
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
        'import type {MessageTag as MessageTag1} from "@formatjs/intl";\ntype MessageTag = string; intl.$t<{ "b": MessageTag1 }, RichOutput>({defaultMessage: \'<b>Hello</b>\'}, values)',
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
        'import type {MessageTag} from \'react-intl\';\nimport type {MessageTag as MessageTag1} from "react-intl"; function f<MessageTag>() { return intl.$t<{ "b": MessageTag1 }, React.ReactNode>({defaultMessage: \'<b>Hello</b>\'}, values) }',
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
        '\'use client\';\nimport type {MessageTag} from "@formatjs/intl"; intl.$t<{ "b": MessageTag }>({defaultMessage: \'<b>Hello</b>\'}, values)',
      filename: 'test.ts',
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      code: 'intl.$t</* @formatjs-generated */ {b: import("@formatjs/intl").MessageTag}, React.ReactNode>({defaultMessage: \'<b>Hello</b>\'}, values)',
      output:
        'import type {MessageTag} from "@formatjs/intl";\nintl.$t<{ "b": MessageTag }, React.ReactNode>({defaultMessage: \'<b>Hello</b>\'}, values)',
      filename: 'test.ts',
      errors: [
        {
          messageId: 'contract',
        },
      ],
    },
    {
      code: "import {defineMessage} from 'react-intl'; defineMessage<{old: string}>({defaultMessage: '{n, number}'})",
      output:
        "import {defineMessage} from 'react-intl'; defineMessage<{ \"n\": number | bigint }>({defaultMessage: '{n, number}'}, {typed: true})",
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
