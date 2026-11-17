import {Temporal} from '#packages/temporal/index.js'
import {
  configureNativeTemporal,
  type NativeQuery,
} from '#packages/temporal/native.js'
import {checkDurationOracle} from '#packages/temporal/tests/duration-oracle.js'

declare const __temporalDurationOracle: string[][]
declare const __formatjsTemporalPlainRelative: string
declare const __temporalZonedDifferenceOracle: string[]
declare function print(value: string): void
const host = globalThis as typeof globalThis & {
  __formatjsTemporalISOQuery?: NativeQuery
}
const query = host.__formatjsTemporalISOQuery!
if (!query) throw new Error('Rust Temporal bridge missing')
delete host.__formatjsTemporalISOQuery
const existing = Temporal.Duration.from('P1DT1.123456789S')
const other = Temporal.Duration.from('PT25H')
const date = Temporal.PlainDate.from('2020-01-31')
const zoned = Temporal.ZonedDateTime.from(
  '2020-03-07T12:00-05:00[America/New_York]'
)
configureNativeTemporal(query)
const actions = [
  {operation: 'transformDuration', run: () => existing.negated()},
  {operation: 'transformDuration', run: () => existing.abs()},
  {operation: 'parseDuration', run: () => Temporal.Duration.from('PT1S')},
  {operation: 'validateDuration', run: () => new Temporal.Duration(0, 0, 0, 1)},
  {operation: 'formatDuration', run: () => existing.toJSON()},
  {operation: 'addDuration', run: () => existing.add(other)},
  {operation: 'roundDuration', run: () => existing.round('second')},
  {operation: 'totalDuration', run: () => existing.total('hour')},
  {
    operation: 'compareDuration',
    run: () => Temporal.Duration.compare(existing, other),
  },
  ...[date, zoned].flatMap(relativeTo => [
    {
      operation: 'roundDuration',
      run: () => existing.round({relativeTo, smallestUnit: 'day'}),
    },
    {
      operation: 'totalDuration',
      run: () => existing.total({relativeTo, unit: 'day'}),
    },
    {
      operation: 'compareDuration',
      run: () => Temporal.Duration.compare(existing, other, {relativeTo}),
    },
  ]),
]
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
      throw new Error('Duration skipped native ' + action.operation)
  }
} finally {
  configureNativeTemporal(query)
}
print(
  JSON.stringify(
    checkDurationOracle(
      Temporal,
      __temporalDurationOracle,
      __formatjsTemporalPlainRelative,
      __temporalZonedDifferenceOracle.join('\n'),
      (actual, expected, context) => {
        if (!Object.is(actual, expected))
          throw new Error(
            context + ': ' + String(actual) + ' !== ' + String(expected)
          )
      }
    )
  )
)
