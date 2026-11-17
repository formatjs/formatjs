import {Temporal} from '#packages/temporal/index.js'
import {
  configureNativeTemporal,
  type NativeQuery,
} from '#packages/temporal/native.js'
import {checkZonedArithmeticOracle} from '#packages/temporal/tests/zoned-arithmetic-oracle.js'

declare const __temporalZonedDifferenceOracle: string[]
declare const __temporalZonedRoundingOracle: string[]
declare function print(value: string): void
const host = globalThis as typeof globalThis & {
  __formatjsTemporalISOQuery?: NativeQuery
}
const query = host.__formatjsTemporalISOQuery!
if (!query) throw new Error('Rust Temporal bridge missing')
delete host.__formatjsTemporalISOQuery
const values = [
  '2020-03-07T12:00[America/New_York]',
  '2400-03-11T12:00[US/Eastern]',
  '2020-10-04T01:45[Australia/Lord_Howe]',
].map(value => Temporal.ZonedDateTime.from(value))
const ends = values.map(value => value.add({months: 1, hours: 2}))
const actions = values.flatMap((value, index) => [
  {operation: 'addZonedDateTime', run: () => value.add({days: 1})},
  {operation: 'addZonedDateTime', run: () => value.subtract({hours: 24})},
  {
    operation: 'differenceZonedDateTime',
    run: () => value.until(ends[index], {largestUnit: 'month'}),
  },
  {
    operation: 'differenceZonedDateTime',
    run: () => value.since(ends[index], {largestUnit: 'month'}),
  },
  {operation: 'roundZonedDateTime', run: () => value.round('day')},
  {operation: 'roundZonedDateTime', run: () => value.round('hour')},
  {operation: 'startOfZonedDay', run: () => value.startOfDay()},
  {operation: 'hoursInZonedDay', run: () => value.hoursInDay},
])
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
      throw new Error('Zoned operation skipped native ' + action.operation)
  }
} finally {
  configureNativeTemporal(query)
}
print(
  JSON.stringify(
    checkZonedArithmeticOracle(
      Temporal,
      __temporalZonedDifferenceOracle.join('\n'),
      __temporalZonedRoundingOracle.join('\n'),
      (actual, expected, context) => {
        if (!Object.is(actual, expected))
          throw new Error(
            context + ': ' + String(actual) + ' !== ' + String(expected)
          )
      }
    )
  )
)
