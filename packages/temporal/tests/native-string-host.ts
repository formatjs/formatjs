import {Temporal} from '#packages/temporal/index.js'
import {
  configureNativeTemporal,
  type NativeQuery,
} from '#packages/temporal/native.js'
import {checkStringOracle} from '#packages/temporal/tests/string-oracle.js'

declare const __temporalISOOracle: number[][]
declare const __temporalTimezoneOracle: string[]
declare function print(value: string): void
const host = globalThis as typeof globalThis & {
  __formatjsTemporalISOQuery?: NativeQuery
}
const query = host.__formatjsTemporalISOQuery!
if (!query) throw new Error('Rust Temporal bridge missing')
delete host.__formatjsTemporalISOQuery
const actions = [
  {
    operation: 'parsePlainDate',
    run: () => Temporal.PlainDate.from('2020-01-01'),
  },
  {
    operation: 'parsePlainDateTime',
    run: () => Temporal.PlainDateTime.from('2020-01-01T12:34'),
  },
  {
    operation: 'parsePlainYearMonth',
    run: () => Temporal.PlainYearMonth.from('2020-01'),
  },
  {
    operation: 'parsePlainMonthDay',
    run: () => Temporal.PlainMonthDay.from('01-01'),
  },
  {
    operation: 'parseZonedFields',
    run: () => Temporal.ZonedDateTime.from('2020-01-01T12:34[UTC]'),
  },
  {
    operation: 'resolveZonedDateTime',
    run: () => Temporal.ZonedDateTime.from('2020-01-01T12:34[UTC]'),
  },
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
      throw new Error('String path skipped native ' + action.operation)
  }
} finally {
  configureNativeTemporal(query)
}
print(
  JSON.stringify(
    checkStringOracle(
      Temporal,
      __temporalISOOracle,
      __temporalTimezoneOracle.join('\n'),
      (actual, expected, context) => {
        if (!Object.is(actual, expected))
          throw new Error(
            context + ': ' + String(actual) + ' !== ' + String(expected)
          )
      }
    )
  )
)
