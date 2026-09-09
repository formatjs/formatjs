interface Result {
  file: string
  scenario: string
  result: {pass: boolean; message?: string}
  rawResult?: {stderr?: string; error?: {name?: string}}
}
export interface Baseline {
  total: number
  failures: Record<string, string>
}

export function failureDiagnostic(message: string, file = ''): string {
  message = message.trimStart()
  if (
    !message.trim() ||
    /(?:^|\n).*?(?:\d+: 0x[0-9a-f]+ |FATAL ERROR:|# Fatal error)/i.test(message)
  ) {
    throw new Error(
      `Test262 host crashed or returned an empty diagnostic: ${message}`
    )
  }
  // This upstream test uses Date.now() as the other range endpoint. Keep its
  // assertion and fractional input stable without snapshotting the wall clock.
  if (
    file.endsWith('DateTimeFormat/prototype/formatRange/argument-to-integer.js')
  ) {
    message = message.replace(
      /«"([^"]*)"», «"([^"]*)"»/,
      (match, actual: string, expected: string) => {
        const separator = ' – '
        const actualStart = actual.lastIndexOf(separator)
        const expectedStart = expected.lastIndexOf(separator)
        if (
          actualStart < 0 ||
          expectedStart < 0 ||
          actual.slice(actualStart) !== expected.slice(expectedStart)
        )
          return match
        return `«"${actual.slice(0, actualStart)} – <current endpoint>"», «"${expected.slice(0, expectedStart)} – <current endpoint>"»`
      }
    )
  }
  if (!message.startsWith('evalmachine.')) return message.split('\n')[0]
  const lines = message.split('\n')
  const start = lines.findIndex(line => /^\w*Error(?::| \{)/.test(line))
  if (start < 0) {
    // Node prints uncaught primitive values after the source caret, without an Error name.
    const caret = lines.findIndex(line => /^\s*\^+\s*$/.test(line))
    const value = caret >= 0 ? lines[caret + 1]?.trim() : ''
    if (value) return `Uncaught ${value}`
    throw new Error(`Unrecognized Test262 diagnostic: ${message}`)
  }
  return lines
    .slice(start)
    .filter(line => !/^\s+at /.test(line) && !line.startsWith('Node.js v'))
    .join('\n')
    .trim()
}

export function summarize(results: Result[]): Baseline {
  if (!Array.isArray(results) || results.length === 0) {
    throw new Error('Test262 discovered no tests')
  }
  const seen = new Set<string>()
  const failures: Record<string, string> = {}
  for (const test of results) {
    if (
      typeof test.file !== 'string' ||
      typeof test.scenario !== 'string' ||
      typeof test.result?.pass !== 'boolean'
    ) {
      throw new Error('Invalid Test262 result')
    }
    const file = test.file.replaceAll('\\', '/').split('/test/').at(-1)!
    const key = `${file} (${test.scenario})`
    if (seen.has(key)) throw new Error(`Duplicate Test262 result: ${key}`)
    seen.add(key)
    if (!test.result.pass) {
      // The upstream validator drops the error name for bare Test262Error().
      // Recover the actual stderr only when the host identified that assertion.
      const message =
        test.result.message ||
        (test.rawResult?.error?.name === 'Test262Error'
          ? test.rawResult.stderr
          : undefined)
      if (!message) throw new Error(`Missing failure detail: ${key}`)
      // Preserve assertion details, excluding sandbox stack frames and engine version.
      failures[key] = failureDiagnostic(message, file)
    }
  }
  return {
    total: results.length,
    failures: Object.fromEntries(
      Object.entries(failures).sort(([a], [b]) => a.localeCompare(b))
    ),
  }
}

export function compare(actual: Baseline, expected: Baseline): string[] {
  const errors: string[] = []
  if (
    !Number.isInteger(expected.total) ||
    expected.total <= 0 ||
    !expected.failures ||
    typeof expected.failures !== 'object'
  ) {
    throw new Error('Invalid Test262 baseline')
  }
  if (actual.total !== expected.total)
    errors.push(
      `Test count changed: ${expected.total} expected, ${actual.total} executed`
    )
  for (const [key, message] of Object.entries(actual.failures)) {
    if (!(key in expected.failures))
      errors.push(`Unexpected failure: ${key}: ${message}`)
    else if (expected.failures[key] !== message)
      errors.push(`Failure changed: ${key}: ${message}`)
  }
  for (const key of Object.keys(expected.failures)) {
    if (!(key in actual.failures))
      errors.push(
        `Expected failure no longer present: ${key}; remove or investigate it`
      )
  }
  return errors
}
