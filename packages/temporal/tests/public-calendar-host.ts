import {Temporal} from '#packages/temporal/index.js'
import {checkPublicCalendarOracle} from '#packages/temporal/tests/public-calendar-oracle.js'
declare function print(value: string): void
const fixture = (
  globalThis as unknown as {__formatjsArithmeticCalendarOracle: string}
).__formatjsArithmeticCalendarOracle
const counts = checkPublicCalendarOracle(
  Temporal,
  fixture,
  (actual, expected, context) => {
    if (!Object.is(actual, expected))
      throw new Error(`${context}: ${String(actual)} !== ${String(expected)}`)
  }
)
if (
  counts.fields !== 34366 ||
  counts.additions !== 32352 ||
  counts.bounds !== 176 ||
  counts.differences !== 32352 ||
  counts.bridges !== 2021 ||
  counts.windows !== 5408
)
  throw new Error(
    `Incomplete public calendar corpus: ${JSON.stringify(counts)}`
  )
print(JSON.stringify(counts))
