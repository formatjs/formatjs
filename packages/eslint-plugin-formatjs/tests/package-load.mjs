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
