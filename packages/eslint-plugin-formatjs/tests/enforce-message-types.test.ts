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
