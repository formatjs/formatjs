import {Temporal} from '#packages/temporal/index.js'
import {checkPlainRelativeOracle} from '#packages/temporal/tests/plain-relative-oracle.js'

declare function print(value: string): void
const fixture = (
  globalThis as unknown as {__formatjsTemporalPlainRelative: string}
).__formatjsTemporalPlainRelative
const counts = checkPlainRelativeOracle(
  Temporal,
  fixture,
  (actual, expected, line) => {
    if (actual !== expected)
      throw new Error(`${line}: ${actual} !== ${expected}`)
  }
)
if (
  counts.rounds !== 51840 ||
  counts.totals !== 17280 ||
  counts.dates !== 20736 ||
  counts.comparisons !== 4224
)
  throw new Error(`Incomplete ICU fixture: ${JSON.stringify(counts)}`)
print(JSON.stringify(counts))
