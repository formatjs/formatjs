import {test} from 'node:test'
import assert from 'node:assert/strict'
import {summarize, compare, failureDiagnostic} from './runner.ts'

const pass = {
  file: '/suite/test/intl402/Example/a.js',
  scenario: 'default',
  result: {pass: true},
}
const fail = {
  ...pass,
  scenario: 'strict mode',
  result: {pass: false, message: 'Expected TypeError'},
}

test('failed assertions remain failures even with tracked expectations', () => {
  const actual = summarize([pass, fail])
  assert.equal(actual.total, 2)
  assert.equal(Object.keys(actual.failures).length, 1)
  assert.equal(compare(actual, {total: 2, failures: {}}).length, 1)
  assert.deepEqual(compare(actual, actual), [])
})
test('unexpected passes and changed errors invalidate the baseline', () => {
  const expected = summarize([fail])
  assert.match(
    compare(summarize([{...fail, result: {pass: true}}]), expected)[0],
    /no longer present/
  )
  assert.match(
    compare(
      summarize([{...fail, result: {pass: false, message: 'Timeout'}}]),
      expected
    )[0],
    /Failure changed/
  )
})
test('empty, malformed, duplicate and missing results cannot pass', () => {
  assert.throws(() => summarize([]), /no tests/)
  assert.throws(() => summarize([{} as never]), /Invalid/)
  assert.throws(() => summarize([pass, pass]), /Duplicate/)
  assert.match(
    compare(summarize([pass]), {total: 2, failures: {}})[0],
    /count changed/
  )
})

test('real harness exits nonzero for assertions and empty suites', async () => {
  const {mkdtempSync, mkdirSync, writeFileSync, rmSync} =
    await import('node:fs')
  const {tmpdir} = await import('node:os')
  const {join} = await import('node:path')
  const {spawnSync} = await import('node:child_process')
  const {fileURLToPath} = await import('node:url')
  const root = mkdtempSync(join(tmpdir(), 'test262-gate-'))
  try {
    mkdirSync(join(root, 'harness'))
    mkdirSync(join(root, 'test/intl402/Fixture'), {recursive: true})
    writeFileSync(join(root, 'package.json'), '{"version":"5.0.0"}')
    for (const file of ['sta.js', 'assert.js'])
      writeFileSync(join(root, 'harness', file), '')
    const testFile = join(root, 'test/intl402/Fixture/test.js')
    const runner = fileURLToPath(new URL('./runner.ts', import.meta.url))
    const run = () =>
      spawnSync(
        process.execPath,
        [runner, '--root', root, '--suite', 'intl402/Fixture'],
        {encoding: 'utf8'}
      )
    writeFileSync(
      testFile,
      '/*---\ndescription: gate fixture\n---*/\nthrow new Error("intentional");'
    )
    const failed = run()
    assert.equal(failed.status, 1, failed.stderr)
    assert.match(failed.stdout, /2 failed/)
    assert.match(failed.stderr, /intentional/)
    writeFileSync(testFile, '/*---\ndescription: gate fixture\n---*/\nvoid 0;')
    const passed = run()
    assert.equal(passed.status, 0, passed.stderr)
    assert.match(passed.stdout, /2 passed/)
    const prelude = join(root, 'prelude.js')
    writeFileSync(prelude, 'globalThis.polyfillMarker = 42;')
    writeFileSync(
      testFile,
      `/*---
description: realm installation
---*/
      if (globalThis.polyfillMarker !== 42) throw new Error('root missing');
      const child = $262.createRealm();
      if (child.global.polyfillMarker !== 42) throw new Error('child missing');
      const grandchild = child.createRealm();
      if (grandchild.global.polyfillMarker !== 42) throw new Error('grandchild missing');
    `
    )
    const realm = spawnSync(
      process.execPath,
      [
        runner,
        '--root',
        root,
        '--suite',
        'intl402/Fixture',
        '--prelude',
        prelude,
      ],
      {encoding: 'utf8'}
    )
    assert.equal(realm.status, 0, realm.stderr)
    assert.match(realm.stdout, /2 passed/)
    rmSync(testFile)
    const empty = run()
    assert.equal(empty.status, 1, empty.stderr)
    assert.match(empty.stderr, /no tests/)
  } finally {
    rmSync(root, {recursive: true, force: true})
  }
})

test('keeps assertion details instead of stack line numbers', () => {
  const diagnostic =
    'evalmachine.<anonymous>:115\n throw error;\nTest262Error {\n  message: "prototype must be absent"\n}\n\nNode.js v24.14.0\n'
  assert.equal(
    failureDiagnostic(diagnostic),
    'Test262Error {\n  message: "prototype must be absent"\n}'
  )
})

test('normalizes only the wall clock in the upstream range truncation test', () => {
  const message =
    'formatRange(-0.9) Expected SameValue(«11:59:59 – 12:15:37», «12:00:00 – 12:15:37») to be true'
  assert.equal(failureDiagnostic(message), message)
  assert.equal(
    failureDiagnostic(
      message,
      'intl402/DateTimeFormat/prototype/formatRange/argument-to-integer.js'
    ),
    'formatRange(-0.9) Expected SameValue(«<time> – <time>», «<time> – <time>») to be true'
  )
})

test('host crashes cannot become tracked assertion failures', () => {
  assert.throws(() => failureDiagnostic('\n'), /host crashed/)
  assert.throws(
    () =>
      failureDiagnostic(
        'Expected no error, got 46: 0x189d644e4 start [/usr/lib/dyld]'
      ),
    /host crashed/
  )
})

test('keeps uncaught primitive values after leading blank lines', () => {
  assert.equal(
    failureDiagnostic(
      '\nevalmachine.<anonymous>:246\nthrow 42;\n      ^\n42\n(Use node --trace-uncaught)\nNode.js v24.14.0'
    ),
    'Uncaught 42'
  )
})
