import {rule as messageTypesRule} from '#packages/eslint-plugin-formatjs/rules/enforce-message-types.js'
import {
  name,
  rule,
} from '#packages/eslint-plugin-formatjs/rules/enforce-placeholders.js'
import {
  dynamicMessage,
  emptyFnCall,
  noMatch,
  spreadJsx,
} from '#packages/eslint-plugin-formatjs/tests/fixtures'
import {
  ruleTester,
  vueRuleTester,
} from '#packages/eslint-plugin-formatjs/tests/util'
for (const [ruleName, testedRule] of [
  [name, rule],
  ['enforce-message-types', messageTypesRule],
] as const) {
  ruleTester.run(ruleName, testedRule, {
    valid: [
      {
        code: "intl.$t({defaultMessage: '<b>Hello</b>'}, {}, {ignoreTag: true})",
      },
      {
        code: "intl.$t({defaultMessage: '<b>Hello</b>'})",
        settings: {formatjs: {ignoreTag: true}},
      },
      {code: "intl.$t({defaultMessage: '<b>Hello</b>'}, {}, unknownOptions)"},
      {code: 'intl.$t({defaultMessage: "\'{fake}\' {n, number}"}, {n: 2})'},
      {
        code: "translate({defaultMessage: '{n}'}, {n: 2})",
        settings: {formatjs: {additionalFunctionNames: ['translate']}},
      },

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
      dynamicMessage,
      noMatch,
      spreadJsx,
      emptyFnCall,
      {
        code: `
        intl.formatMessage({
          defaultMessage: '{count, plural, one {#} other {# more}}',
          description: 'asd'
      })`,
        options: [{ignoreList: ['count']}],
      },
      {
        code: `
        intl.formatMessage({
          defaultMessage: '<b>foo</b>',
          description: 'asd'
      })`,
        options: [{ignoreList: ['b']}],
      },
    ],
    invalid: [
      {
        code: `
        intl.formatMessage({
          defaultMessage: '{count, plural, one {#} other {# more}}',
          description: 'asd'
      })`,
        errors: [{messageId: 'missingValue', data: {list: 'count'}}],
      },
      {
        code: `
        intl.formatMessage({
          defaultMessage: '<b>foo</b>',
          description: 'asd'
      })`,
        errors: [{messageId: 'missingValue', data: {list: 'b'}}],
      },
      {
        code: `
        intl.formatMessage({
          defaultMessage: '{aDifferentKey, plural, one {#} other {# more}}',
          description: 'asd'
      }, {foo: 1})`,
        errors: [
          {messageId: 'missingValue', data: {list: 'aDifferentKey'}},
          {messageId: 'unusedValue'},
        ],
      },
      {
        code: `
        import {FormattedMessage} from 'react-intl'
        const a = <FormattedMessage
        defaultMessage="{count, plural, one {#} other {# more}}"
        />`,
        errors: [{messageId: 'missingValue', data: {list: 'count'}}],
      },
      {
        code: `
        import {FormattedMessage} from 'react-intl'
        const a = <FormattedMessage
        defaultMessage="{count, plural, one {#} other {# more}}"
        values={{foo: 1}}
        />`,
        errors: [
          {messageId: 'missingValue', data: {list: 'count'}},
          {messageId: 'unusedValue'},
        ],
      },
      {
        code: `
        import {FormattedMessage} from 'react-intl'
        const a = <FormattedMessage id="myMessage" defaultMessage="Hello {name}" values={{ notName: "Denis" }} />`,
        errors: [
          {messageId: 'missingValue', data: {list: 'name'}},
          {messageId: 'unusedValue'},
        ],
      },
      {
        code: `
        import {FormattedMessage} from 'react-intl'
        const a = <FormattedMessage defaultMessage="Hello <bold>{name}</bold>" values={{ bold: (msg) => <strong>{msg}</strong> }} />`,
        errors: [
          {
            messageId: 'missingValue',
            data: {list: 'name'},
          },
        ],
      },
      {
        code: `
        intl.formatMessage({
          defaultMessage: '{count, plural, one {<a>#</a>} other {# more}}',
          description: 'asd'
        }, {
          count: 1,
        })
        `,
        errors: [
          {
            messageId: 'missingValue',
            data: {list: 'a'},
          },
        ],
      },
      {
        code: `
      {$t({ 
        defaultMessage: "My name is {name}" 
      })}
      `,
        errors: [
          {
            messageId: 'missingValue',
            data: {list: 'name'},
          },
        ],
      },
      {
        code: `
        import {FormattedMessage} from 'react-intl'
        const a = <FormattedMessage
        defaultMessage="{count, plural, one {#} other {# more}}"
        values={{foo: 0, count: 1, bar: 2}}
        />`,
        errors: [{messageId: 'unusedValue'}, {messageId: 'unusedValue'}],
      },
      {
        code: `
        import {FormattedMessage} from 'react-intl'
        const a = <FormattedMessage
        defaultMessage="{foo} {bar}"
        />`,
        errors: [{messageId: 'missingValue', data: {list: 'foo, bar'}}],
      },
      // Does not crash when there are parser errors
      {
        code: `
      {intl.formatMessage({ 
        defaultMessage: "My name is {name" 
      })}
      `,
        errors: [
          {
            messageId: 'parseError',
            data: {
              error: 'EXPECT_ARGUMENT_CLOSING_BRACE',
            },
          },
        ],
      },
    ],
  })
}

for (const [ruleName, testedRule] of [
  [name, rule],
  ['enforce-message-types', messageTypesRule],
] as const) {
  vueRuleTester.run(ruleName + ' Vue parity', testedRule, {
    valid: [
      {
        filename: 'test.vue',
        code: '<template>{{ $t({defaultMessage: "Hello {name}"}, {name: "Ada"}) }}</template>',
      },
    ],
    invalid: [
      {
        filename: 'test.vue',
        code: '<template>{{ $t({defaultMessage: "Hello {name}"}) }}</template>',
        errors: [{messageId: 'missingValue'}],
      },
    ],
  })
}
