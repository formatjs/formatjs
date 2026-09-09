import {readFileSync} from 'node:fs'
import {validateReport} from './validate.ts'
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {summarize, compare, failureDiagnostic} from './results.ts'

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

test('keeps assertion details instead of stack line numbers', () => {
  const diagnostic =
    'evalmachine.<anonymous>:115\n throw error;\nTest262Error {\n  message: "prototype must be absent"\n}\n\nNode.js v24.14.0\n'
  assert.equal(
    failureDiagnostic(diagnostic),
    'Test262Error {\n  message: "prototype must be absent"\n}'
  )
})

test('normalizes only the shared clock-dependent endpoint', () => {
  const message =
    'formatRange(-0.9) Expected SameValue(«"11:59:59 PM – 12:15:37 AM"», «"12:00:00 AM – 12:15:37 AM"») to be true'
  const file =
    'intl402/DateTimeFormat/prototype/formatRange/argument-to-integer.js'
  assert.equal(failureDiagnostic(message), message)
  assert.equal(
    failureDiagnostic(message, file),
    'formatRange(-0.9) Expected SameValue(«"11:59:59 PM – <current endpoint>"», «"12:00:00 AM – <current endpoint>"») to be true'
  )
  const differentEndpoints = message.replace('12:15:37 AM', '12:16:37 AM')
  assert.equal(failureDiagnostic(differentEndpoints, file), differentEndpoints)
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

for (const fixture of ['pass', 'fail', 'empty']) {
  test(`generated harness ${fixture} report`, () => {
    const report = readFileSync(
      `${process.env.TEST262_REPORT_DIR}/fixture-${fixture}.json`,
      'utf8'
    )
    const status = Number(
      readFileSync(
        `${process.env.TEST262_REPORT_DIR}/fixture-${fixture}.status`,
        'utf8'
      ).trim()
    )
    if (fixture === 'empty') {
      assert.throws(
        () => validateReport(report, status, {total: 2, failures: {}}),
        /no tests/
      )
      return
    }
    const actual = summarize(JSON.parse(report))
    assert.equal(actual.total, 2)
    assert.equal(status, fixture === 'fail' ? 1 : 0)
    if (fixture === 'fail')
      assert.ok(
        Object.values(actual.failures).every(message =>
          message.includes('intentional')
        )
      )
    assert.deepEqual(validateReport(report, status, actual), [])
    assert.throws(() => validateReport(report, 1 - status, actual), /disagrees/)
    assert.equal(
      validateReport(report, status, {total: 2, failures: {}}).length,
      fixture === 'fail' ? 2 : 0
    )
  })
}
