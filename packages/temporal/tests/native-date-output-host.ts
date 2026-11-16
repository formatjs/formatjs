import {Temporal} from '#packages/temporal/index.js'
import {
  configureNativeTemporal,
  type NativeQuery,
} from '#packages/temporal/native.js'
import {checkDateOutputOracle} from '#packages/temporal/tests/date-output-oracle.js'

declare const __temporalShortDateOracle: string[]
declare function print(value: string): void
const host = globalThis as typeof globalThis & {
  __formatjsTemporalISOQuery?: NativeQuery
}
const query = host.__formatjsTemporalISOQuery!
if (!query) throw new Error('Rust Temporal bridge missing')
delete host.__formatjsTemporalISOQuery
const date = Temporal.PlainDate.from('2020-02-29'),
  time = date.toPlainDateTime('23:59:59.999999999')
const ym = new Temporal.PlainYearMonth(2020, 2),
  end = new Temporal.PlainYearMonth(2021, 3),
  md = new Temporal.PlainMonthDay(2, 29)
const zoned = Temporal.ZonedDateTime.from('2020-03-08T01:30[America/New_York]')
const actions = [
  {operation: 'formatPlainDate', run: () => date.toJSON()},
  {operation: 'formatPlainDateTime', run: () => time.toJSON()},
  {operation: 'formatPlainYearMonth', run: () => ym.toJSON()},
  {operation: 'formatPlainMonthDay', run: () => md.toJSON()},
  {operation: 'formatZonedDateTime', run: () => zoned.toJSON()},
  {operation: 'addPlainYearMonth', run: () => ym.add({months: 1})},
  {operation: 'addPlainYearMonth', run: () => ym.subtract({months: 1})},
  {operation: 'differencePlainYearMonth', run: () => ym.until(end)},
  {operation: 'differencePlainYearMonth', run: () => ym.since(end)},
  {operation: 'yearMonthToDate', run: () => ym.toPlainDate({day: 29})},
  {operation: 'monthDayToDate', run: () => md.toPlainDate({year: 2020})},
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
      throw new Error('Date operation skipped native ' + action.operation)
  }
} finally {
  configureNativeTemporal(query)
}
print(
  JSON.stringify({
    shortDates: checkDateOutputOracle(
      Temporal,
      __temporalShortDateOracle.join('\n'),
      (actual, expected, context) => {
        if (!Object.is(actual, expected))
          throw new Error(
            context + ': ' + String(actual) + ' !== ' + String(expected)
          )
      }
    ),
  })
)
