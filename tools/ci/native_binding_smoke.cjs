const assert = require('node:assert/strict')
const path = require('node:path')
if (process.argv[3]) assert.equal(process.platform, process.argv[3])
if (process.argv[4]) assert.equal(process.arch, process.argv[4])
const native = require(path.resolve(process.argv[2]))
const source =
  'import {defineMessage} from "react-intl"; const greeting = "Hello"; defineMessage({id: "greeting", defaultMessage: greeting + " world"})'
const expression = 'greeting + " world"'
const start = source.indexOf(expression)
const evaluated = native.evaluateStrings(source, 'smoke.js', [
  {start, end: start + expression.length},
])
assert.deepEqual(
  evaluated.map(result => result.value),
  ['Hello world']
)
const literalSource =
  source.slice(0, start) +
  JSON.stringify(evaluated[0].value) +
  source.slice(start + expression.length)
const extracted = JSON.parse(
  native.extractSources(
    [{filename: 'smoke.js', source: literalSource}],
    {throws: true},
    false
  )
)
assert.equal(extracted.files[0].messages[0].defaultMessage, 'Hello world')
const compiled = JSON.parse(
  native.compileMessages(
    [{id: 'hello', message: 'Hello {name}', sourceFile: 'smoke.json'}],
    {ast: true}
  )
)
assert.deepEqual(compiled.hello, [
  {type: 0, value: 'Hello '},
  {type: 1, value: 'name'},
])
console.log('Native evaluation, extraction and compilation passed')
