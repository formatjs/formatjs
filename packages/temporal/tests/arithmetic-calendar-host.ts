import {checkArithmeticCalendarOracle} from '#packages/temporal/tests/arithmetic-calendar-oracle.js'
declare function print(value: string): void
const fixture = (
  globalThis as unknown as {__formatjsArithmeticCalendarOracle: string}
).__formatjsArithmeticCalendarOracle
const counts = checkArithmeticCalendarOracle(
  fixture,
  (actual, expected, line) => {
    if (actual !== expected)
      throw new Error(`${line}: ${actual} !== ${expected}`)
  }
)
if (
  counts.calendars !== 13 ||
  counts.fields !== 34366 ||
  counts.additions !== 32352 ||
  counts.bounds !== 176 ||
  counts.differences !== 32352
)
  throw new Error(`Incomplete ICU corpus: ${JSON.stringify(counts)}`)
print(JSON.stringify(counts))
