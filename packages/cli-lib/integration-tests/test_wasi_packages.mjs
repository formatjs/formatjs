import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {evaluateStrings} from '../pkg/static-evaluation.js'

const cli = fileURLToPath(
  new URL('../../cli/pkg/bin/formatjs', import.meta.url)
)
const source = "const greeting = 'Hello';\nconst message = greeting + ' world';"
const expression = "greeting + ' world'"
const start = source.indexOf(expression)
const end = start + expression.length

assert.deepEqual(evaluateStrings(source, 'messages.ts', [{start, end}]), [
  {start, end, value: 'Hello world'},
])

const cwd = mkdtempSync(join(tmpdir(), 'formatjs-wasi-'))

function runCli(...args) {
  return execFileSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: 'utf8',
    env: {...process.env, FORMATJS_FORCE_WASI: '1'},
  })
}

try {
  writeFileSync(
    join(cwd, 'messages.tsx'),
    `import {FormattedMessage} from 'react-intl';
export const message = <FormattedMessage id="hello" defaultMessage="Hello world" />;`
  )
  const extracted = JSON.parse(runCli('extract', 'messages.tsx', '--throws'))
  assert.deepEqual(extracted, {hello: {defaultMessage: 'Hello world'}})

  writeFileSync(join(cwd, 'messages.json'), JSON.stringify(extracted))
  assert.deepEqual(JSON.parse(runCli('compile', '*.json')), {
    hello: 'Hello world',
  })

  mkdirSync(join(cwd, 'values'))
  mkdirSync(join(cwd, 'values-fr'))
  writeFileSync(
    join(cwd, 'values/strings.xml'),
    '<resources><string name="hello">Hello %1$s</string></resources>'
  )
  writeFileSync(
    join(cwd, 'values-fr/strings.xml'),
    '<resources><string name="hello">Bonjour %1$s</string></resources>'
  )
  runCli(
    'verify',
    'values*/strings.xml',
    '--message-syntax',
    'android',
    '--source-locale',
    'en',
    '--structural-equality'
  )
} finally {
  rmSync(cwd, {force: true, recursive: true})
}
