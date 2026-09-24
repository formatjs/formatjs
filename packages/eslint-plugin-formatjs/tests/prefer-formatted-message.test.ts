import {Linter} from 'eslint'
import {expect, it} from 'vitest'
import {
  rule,
  name,
} from '#packages/eslint-plugin-formatjs/rules/prefer-formatted-message.js'
import {ruleTester} from '#packages/eslint-plugin-formatjs/tests/util'
import {
  dynamicMessage,
  noMatch,
  spreadJsx,
  emptyFnCall,
  defineMessage,
} from '#packages/eslint-plugin-formatjs/tests/fixtures'

ruleTester.run(name, rule, {
  valid: [
    defineMessage,
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
    {
      code: `
      <div>
        <FormattedMessage defaultMessage="test" />
      </div>
      `,
    },
    {
      code: `<img src="/example.png" alt={intl.formatMessage({defaultMessage: 'test'})} />`,
    },
    // GH #4890: formatMessage in attributes (not JSX children) should still be valid
    {
      code: `<img src="/example.png" alt={formatMessage({defaultMessage: 'test'})} />`,
    },
    // GH #4890: formatMessage with non-object argument should not be flagged
    {
      code: `
      <div>
        {formatMessage(someVariable)}
      </div>
      `,
    },
  ],
  invalid: [
    {
      code: `
      <div>
        {intl.formatMessage({
          defaultMessage: 'test',
        })}
      </div>
      `,
      errors: [
        {
          messageId: 'jsxChildren',
        },
      ],
    },
    {
      code: `
      <div>
        {intl.formatMessage({
          defaultMessage: 'hello',
        })}
        {' '}
        {intl.formatMessage({
          defaultMessage: 'world',
        })}
      </div>
      `,
      errors: [
        {
          messageId: 'jsxChildren',
        },
        {
          messageId: 'jsxChildren',
        },
      ],
    },
    // GH #4890: Destructured formatMessage should also be detected
    {
      code: `
      <div>
        {formatMessage({
          defaultMessage: 'test',
        })}
      </div>
      `,
      errors: [
        {
          messageId: 'jsxChildren',
        },
      ],
    },
    {
      code: `
      <div>
        {formatMessage({
          defaultMessage: 'hello',
        })}
        {' '}
        {formatMessage({
          defaultMessage: 'world',
        })}
      </div>
      `,
      errors: [
        {
          messageId: 'jsxChildren',
        },
        {
          messageId: 'jsxChildren',
        },
      ],
    },
    // GH #4890: $t alias should also work
    {
      code: `
      <div>
        {$t({
          defaultMessage: 'test',
        })}
      </div>
      `,
      errors: [
        {
          messageId: 'jsxChildren',
        },
      ],
    },
  ],
})

const hookImport = "import {useIntl} from 'react-intl';"
const componentImport = "import {FormattedMessage, useIntl} from 'react-intl';"
const withIntl = (child: string) =>
  hookImport +
  '\nfunction Example() { const intl = useIntl(); return <div>' +
  child +
  '</div>; }'
const withFix = (child: string) =>
  withIntl(child).replace(hookImport, componentImport)

ruleTester.run(name + ' autofix', rule, {
  valid: [],
  invalid: [
    ...[
      [
        "intl.formatMessage({defaultMessage: 'Hello'})",
        "<FormattedMessage defaultMessage={('Hello')} />",
      ],
      [
        "intl.$t({id, defaultMessage: 'Hello {name}', description: 'Greeting'}, {name})",
        "<FormattedMessage id={(id)} defaultMessage={('Hello {name}')} description={('Greeting')} values={({name})} />",
      ],
      [
        "intl.formatMessage({'defaultMessage': 'Quotes \" & < >', 'id': messageId}, values)",
        "<FormattedMessage defaultMessage={('Quotes \" & < >')} id={(messageId)} values={(values)} />",
      ],
      [
        'intl.formatMessage({defaultMessage: (first(), message)}, (one(), values))',
        '<FormattedMessage defaultMessage={(first(), message)} values={(one(), values)} />',
      ],
    ].map(([expression, output]) => ({
      code: withIntl('{' + expression + '}'),
      output: withFix(output),
      errors: [{messageId: 'jsxChildren'}],
    })),
    {
      code: withIntl(
        "{intl.formatMessage({defaultMessage: 'Hello'})}{intl.formatMessage({id: 'world'})}"
      ),
      output: withFix(
        "<FormattedMessage defaultMessage={('Hello')} />{intl.formatMessage({id: 'world'})}"
      ),
      errors: [{messageId: 'jsxChildren'}, {messageId: 'jsxChildren'}],
    },
    {
      code: "import {useIntl, FormattedMessage as Message} from 'react-intl'; function Example() { const {$t} = useIntl(); return <>{$t({id: 'hello'})}</>; }",
      output:
        "import {useIntl, FormattedMessage as Message} from 'react-intl'; function Example() { const {$t} = useIntl(); return <><Message id={('hello')} /></>; }",
      errors: [{messageId: 'jsxChildren'}],
    },
    {
      code: "import {useIntl as useI18n, FormattedMessage} from 'react-intl'; function Example() { const {formatMessage: $t} = useI18n(); return <div>{$t({id: 'hello'})}</div>; }",
      output:
        "import {useIntl as useI18n, FormattedMessage} from 'react-intl'; function Example() { const {formatMessage: $t} = useI18n(); return <div><FormattedMessage id={('hello')} /></div>; }",
      errors: [{messageId: 'jsxChildren'}],
    },
    {
      code: withIntl("{intl.formatMessage({id: 'hello'})}").replace(
        'Example()',
        'Example(FormattedMessage)'
      ),
      output: withFix("<FormattedMessage1 id={('hello')} />")
        .replace(
          componentImport,
          "import {FormattedMessage as FormattedMessage1, useIntl} from 'react-intl';"
        )
        .replace('Example()', 'Example(FormattedMessage)'),
      errors: [{messageId: 'jsxChildren'}],
    },
    {
      code: withIntl("{intl.formatMessage({id: 'hello'})}").replace(
        hookImport,
        hookImport + "\nimport type {FormattedMessage} from 'react-intl';"
      ),
      output: withFix("<FormattedMessage1 id={('hello')} />").replace(
        componentImport,
        "import {FormattedMessage as FormattedMessage1, useIntl} from 'react-intl';\nimport type {FormattedMessage} from 'react-intl';"
      ),
      errors: [{messageId: 'jsxChildren'}],
    },
    ...[
      "intl.formatMessage({id: 'hello'}, values, {ignoreTag: true})",
      "intl.formatMessage({...descriptor, id: 'hello'})",
      "intl.formatMessage({[key]: 'hello'})",
      "intl.formatMessage({get id() { return 'hello' }})",
      "intl.formatMessage({id() { return 'hello' }})",
      "intl.formatMessage({id: 'hello', id: 'world'})",
      "intl.formatMessage({id: 'hello', tagName: 'span'})",
      "intl.formatMessage({id: 'hello', key: 'key'})",
      "intl.formatMessage({id: 'hello', values: nestedValues})",
      "intl.formatMessage({id: 'hello'}, ...values)",
      "intl?.formatMessage({id: 'hello'})",
      "intl.formatMessage?.({id: 'hello'})",
      "intl.formatMessage({id: 'hello'} as const)",
      "intl.formatMessage<Values>({id: 'hello'})",
      "intl.formatMessage({id: /* keep */ 'hello'})",
      "intl.formatMessage({id: 'hello'} /* keep */)",
    ].map(expression => ({
      code: withIntl('{' + expression + '}'),
      errors: [{messageId: 'jsxChildren'}],
    })),
    {
      code: withIntl("{intl.formatMessage({id: 'hello'})}").replace(
        'const intl = useIntl()',
        'const intl = createIntl(config)'
      ),
      errors: [{messageId: 'jsxChildren'}],
    },
    {
      code: withIntl("{intl.formatMessage({id: 'hello'})}").replace(
        'Example()',
        'Example(useIntl)'
      ),
      errors: [{messageId: 'jsxChildren'}],
    },
    {
      code: withIntl("{intl.formatMessage({id: 'hello'})}").replace(
        "'react-intl'",
        "'other-library'"
      ),
      errors: [{messageId: 'jsxChildren'}],
    },
  ],
})

it('fixes every JSX child across passes and remains stable in ESLint', () => {
  const linter = new Linter()
  const config = {
    languageOptions: {parserOptions: {ecmaFeatures: {jsx: true}}},
    plugins: {formatjs: {rules: {[name]: rule}}},
    rules: {['formatjs/' + name]: 'error' as const},
  }
  const calls = Array.from(
    {length: 20},
    (_, index) => "{intl.formatMessage({id: '" + index + "'})}"
  ).join('')
  const components = Array.from(
    {length: 20},
    (_, index) => "<FormattedMessage id={('" + index + "')} />"
  ).join('')
  const fixed = linter.verifyAndFix(withIntl(calls), config)
  expect(fixed.messages).toEqual([])
  expect(fixed.output).toBe(withFix(components))
  expect(linter.verifyAndFix(fixed.output, config)).toEqual({
    fixed: false,
    messages: [],
    output: fixed.output,
  })
})

ruleTester.run(name + ' import safety', rule, {
  valid: [],
  invalid: [
    {
      code: "import {useIntl, FormattedMessage} from 'react-intl'; function Example(FormattedMessage) { const intl = useIntl(); return <div>{intl.formatMessage({id: 'hello'})}</div>; }",
      output:
        "import {FormattedMessage as FormattedMessage1, useIntl, FormattedMessage} from 'react-intl'; function Example(FormattedMessage) { const intl = useIntl(); return <div><FormattedMessage1 id={('hello')} /></div>; }",
      errors: [{messageId: 'jsxChildren'}],
    },
    {
      code: "import {useIntl, FormattedMessage as message} from 'react-intl'; function Example() { const intl = useIntl(); return <div>{intl.formatMessage({id: 'hello'})}</div>; }",
      output:
        "import {FormattedMessage, useIntl, FormattedMessage as message} from 'react-intl'; function Example() { const intl = useIntl(); return <div><FormattedMessage id={('hello')} /></div>; }",
      errors: [{messageId: 'jsxChildren'}],
    },
    {
      code: "import {useIntl, type FormattedMessage} from 'react-intl'; function Example() { const intl = useIntl(); return <div>{intl.formatMessage({id: 'hello'})}</div>; }",
      output:
        "import {FormattedMessage as FormattedMessage1, useIntl, type FormattedMessage} from 'react-intl'; function Example() { const intl = useIntl(); return <div><FormattedMessage1 id={('hello')} /></div>; }",
      errors: [{messageId: 'jsxChildren'}],
    },
    {
      code:
        "'use client'; import * as ReactIntl from 'react-intl'; " +
        withIntl("{intl.formatMessage({id: 'hello'})}"),
      output:
        "'use client'; import * as ReactIntl from 'react-intl'; " +
        withFix("<FormattedMessage id={('hello')} />"),
      errors: [{messageId: 'jsxChildren'}],
    },
    {
      code: withIntl("{intl.formatMessage({id: 'hello'})}{FormattedMessage}"),
      output: withFix(
        "<FormattedMessage1 id={('hello')} />{FormattedMessage}"
      ).replace(
        componentImport,
        "import {FormattedMessage as FormattedMessage1, useIntl} from 'react-intl';"
      ),
      errors: [{messageId: 'jsxChildren'}],
    },
    {
      code: "import {useIntl} from 'react-intl'; function Example() { const {formatMessage: translate} = useIntl(); return <>{translate({id: 'hello'})}</>; }",
      output:
        "import {FormattedMessage, useIntl} from 'react-intl'; function Example() { const {formatMessage: translate} = useIntl(); return <><FormattedMessage id={('hello')} /></>; }",
      settings: {formatjs: {additionalFunctionNames: ['translate']}},
      errors: [{messageId: 'jsxChildren'}],
    },
    {
      code: withIntl("{intl.formatMessage({id: 'hello'})}").replace(
        'const intl',
        'let intl'
      ),
      errors: [{messageId: 'jsxChildren'}],
    },
    {
      code: withIntl("{intl.formatMessage({id: 'hello'})}").replace(
        hookImport,
        "import type {useIntl} from 'react-intl';"
      ),
      errors: [{messageId: 'jsxChildren'}],
    },
    {
      code: withIntl("{intl.translate({id: 'hello'})}"),
      settings: {formatjs: {additionalFunctionNames: ['translate']}},
      errors: [{messageId: 'jsxChildren'}],
    },
  ],
})
