import {Temporal} from '#packages/temporal/index.js'
import {
  checkPublicCalendarOracle,
  checkCalendarDifferencePolicy,
  checkYearMonthDifferencePrivateFields,
  checkDateTimeDifferencePrivateUnits,
  checkDifferenceOptionOrder,
  checkDateDifferenceUnitGroup,
} from '#packages/temporal/tests/public-calendar-oracle.js'
declare function print(value: string): void
const fixture = (
  globalThis as unknown as {__formatjsArithmeticCalendarOracle: string}
).__formatjsArithmeticCalendarOracle
checkDateDifferenceUnitGroup(Temporal, (actual, expected, context) => {
  if (actual !== expected) throw new Error(context)
})
checkYearMonthDifferencePrivateFields(Temporal, (actual, expected, context) => {
  if (actual !== expected) throw new Error(context)
})
checkDateTimeDifferencePrivateUnits(Temporal, (actual, expected, context) => {
  if (actual !== expected) throw new Error(context)
})
checkDifferenceOptionOrder(Temporal, (actual, expected, context) => {
  if (actual !== expected) throw new Error(context)
})
checkCalendarDifferencePolicy(Temporal, (actual, expected, context) => {
  if (actual !== expected)
    throw new Error(`${context}: ${actual} !== ${expected}`)
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
