import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join, resolve} from 'node:path'
import {runInNewContext} from 'node:vm'

const directory = mkdtempSync(join(tmpdir(), 'formatjs-locale-emitter-'))
try {
  const inputs = ['en', 'fr'].map(locale => ({
    locale,
    data: JSON.parse('{"__proto__":{"preserved":true}}'),
    text: `Quotes ' " backslash \\ newline\nline separators \u2028\u2029`,
  }))
  for (const input of inputs) {
    writeFileSync(
      join(directory, input.locale + '.json'),
      JSON.stringify(input)
    )
  }
  // Property names and payloads must be escaped by the AST printer.
  const method = 'register "locale"'
  const queue = 'pending "locales"'
  const output = join(directory, 'output')
  execFileSync(
    resolve(process.argv[2]),
    [
      ...inputs.flatMap(input => [
        '--input',
        join(directory, input.locale + '.json'),
      ]),
      '--outDir',
      output,
      '--method',
      method,
      '--queue',
      queue,
    ],
    {stdio: 'pipe'}
  )
  const registered: unknown[] = []
  const queued: unknown[] = ['existing']
  for (const input of inputs) {
    const source = readFileSync(join(output, input.locale + '.js'), 'utf8')
    runInNewContext(source, {
      Intl: {
        DateTimeFormat: {[method]: (value: unknown) => registered.push(value)},
      },
    })
    runInNewContext(source, {Intl: {}, [queue]: queued})
    assert.ok(
      readFileSync(join(output, input.locale + '.d.ts'), 'utf8').includes(
        'export'
      )
    )
  }
  assert.deepEqual(JSON.parse(JSON.stringify(registered)), inputs)
  assert.deepEqual(JSON.parse(JSON.stringify(queued)), ['existing', ...inputs])
} finally {
  rmSync(directory, {recursive: true, force: true})
}
