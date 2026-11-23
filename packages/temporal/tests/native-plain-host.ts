import {Temporal} from '#packages/temporal/index.js'
import {
  configureNativeTemporal,
  type NativeQuery,
} from '#packages/temporal/native.js'
import {checkPlainArithmeticOracle} from '#packages/temporal/tests/plain-arithmetic-oracle.js'
import {checkPlainRelativeOracle} from '#packages/temporal/tests/plain-relative-oracle.js'

declare const __temporalDateArithmeticOracle: string[]
declare const __temporalPlainTimeOracle: string[][]
declare const __temporalDurationOracle: string[][]
declare const __formatjsTemporalPlainRelative: string
declare function print(value: string): void
const host = globalThis as typeof globalThis & {
  __formatjsTemporalISOQuery?: NativeQuery
}
const query = host.__formatjsTemporalISOQuery!
if (!query) throw new Error('Rust Temporal bridge missing')
delete host.__formatjsTemporalISOQuery
const date = Temporal.PlainDate.from('2020-01-31')
const dateEnd = Temporal.PlainDate.from('2021-03-01')
const time = Temporal.PlainDateTime.from('2020-02-29T23:59:59.999999999')
const timeEnd = Temporal.PlainDateTime.from('2021-03-01T00:00:00')
const actions = [
  {operation: 'addPlainDate', run: () => date.add({months: 1, hours: 25})},
  {operation: 'addPlainDate', run: () => date.subtract({months: 1, hours: 25})},
  {operation: 'addPlainDateTime', run: () => time.add({months: 1, hours: 25})},
  {
    operation: 'addPlainDateTime',
    run: () => time.subtract({months: 1, hours: 25}),
  },
  {
    operation: 'differencePlainDate',
    run: () =>
      date.until(dateEnd, {largestUnit: 'year', smallestUnit: 'month'}),
  },
  {
    operation: 'differencePlainDate',
    run: () =>
      date.since(dateEnd, {largestUnit: 'year', smallestUnit: 'month'}),
  },
  {
    operation: 'differencePlainDateTime',
    run: () =>
      time.until(timeEnd, {largestUnit: 'year', smallestUnit: 'month'}),
  },
  {
    operation: 'differencePlainDateTime',
    run: () =>
      time.since(timeEnd, {largestUnit: 'year', smallestUnit: 'month'}),
  },
  {operation: 'roundPlainDateTime', run: () => time.round('day')},
  {operation: 'roundPlainDateTime', run: () => time.round('second')},
]
configureNativeTemporal(query)
for (const action of actions) action.run()
try {
  for (const action of actions) {
    configureNativeTemporal(request =>
      JSON.parse(request).op === action.operation ? 1 : query(request)
    )
    let rejected = false
    try {
      action.run()
    } catch (error) {
      rejected = error instanceof RangeError
    }
    if (!rejected)
      throw new Error('Plain operation skipped native ' + action.operation)
  }
} finally {
  configureNativeTemporal(query)
}
function equal(actual: unknown, expected: unknown, context: string): void {
  if (!Object.is(actual, expected))
    throw new Error(
      context + ': ' + String(actual) + ' !== ' + String(expected)
    )
}
print(
  JSON.stringify({
    arithmetic: checkPlainArithmeticOracle(
      Temporal,
      __temporalDateArithmeticOracle.join('\n'),
      __temporalPlainTimeOracle,
      __temporalDurationOracle,
      equal
    ),
    relative: checkPlainRelativeOracle(
      Temporal,
      __formatjsTemporalPlainRelative,
      equal
    ),
  })
)
