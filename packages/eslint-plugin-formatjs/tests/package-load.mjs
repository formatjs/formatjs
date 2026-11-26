import assert from 'node:assert/strict'
import {Linter} from 'eslint'
import plugin from 'eslint-plugin-formatjs'

const linter = new Linter()
const messages = linter.verify("defineMessage({defaultMessage: 'Hello 😀'})", [
  {
    plugins: {formatjs: plugin},
    rules: {'formatjs/no-emoji': 'error'},
  },
])
assert.equal(messages.length, 1)
assert.equal(messages[0].ruleId, 'formatjs/no-emoji')
assert.equal(messages[0].fatal, undefined)
assert.deepEqual(
  linter.verify("defineMessage({defaultMessage: 'Hello world'})", [
    {
      plugins: {formatjs: plugin},
      rules: {'formatjs/no-emoji': 'error'},
    },
  ]),
  []
)

const notationMessages = linter.verify(
  "defineMessage({defaultMessage: 'v{version} {count}day'})",
  [
    {
      plugins: {formatjs: plugin},
      rules: {
        'formatjs/prefer-full-sentence': [
          'error',
          {allowlist: [{argument: 'version', prefix: 'v'}]},
        ],
      },
    },
  ]
)
assert.equal(notationMessages.length, 1)
assert.equal(notationMessages[0].messageId, 'placeholderAdjacentToWord')
assert.equal(notationMessages[0].fatal, undefined)
assert.deepEqual(
  linter.verify("defineMessage({defaultMessage: 'v{version}'})", [
    {
      plugins: {formatjs: plugin},
      rules: {
        'formatjs/prefer-full-sentence': [
          'error',
          {allowlist: [{argument: 'version', prefix: 'v'}]},
        ],
      },
    },
  ]),
  []
)
