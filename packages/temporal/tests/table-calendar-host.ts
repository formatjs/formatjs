import {Temporal} from '#packages/temporal/index.js'
import {
  checkPublicCalendarOracle,
  checkUmmAlQuraJoins,
} from '#packages/temporal/tests/public-calendar-oracle.js'
declare function print(value: string): void
const fixture = (
  globalThis as unknown as {__formatjsTableCalendarOracle: string}
).__formatjsTableCalendarOracle
checkUmmAlQuraJoins(Temporal, (actual, expected, context) => {
  if (actual !== expected) throw new Error(context)
})
const counts = checkPublicCalendarOracle(
  Temporal,
  fixture,
  (actual, expected, context) => {
    if (!Object.is(actual, expected))
      throw new Error(`${context}: ${String(actual)} !== ${String(expected)}`)
  }
)
if (
  counts.fields !== 15932 ||
  counts.additions !== 6720 ||
  counts.differences !== 6720 ||
  counts.bridges !== 937 ||
  counts.bounds !== 0 ||
  counts.windows !== 1248
)
  throw new Error(`Incomplete table-calendar oracle: ${JSON.stringify(counts)}`)
print(JSON.stringify(counts))
