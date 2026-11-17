import {Temporal} from '#packages/temporal/index.js'
import {
  configureNativeTemporal,
  type NativeQuery,
} from '#packages/temporal/native.js'
import {
  zonedKernel,
  resolveTimeZone,
  timeZoneIdentifier,
  primaryTimeZoneIdentifier,
} from '#packages/temporal/zones.js'
import {checkTimezoneOracle} from '#packages/temporal/tests/timezone-oracle.js'

declare const __temporalTimezoneOracle: string[]
declare const __temporalTransitionOracle: string[]
declare const __temporalTimezoneIdentityOracle: string[]
declare function print(value: string): void
const host = globalThis as typeof globalThis & {
  __formatjsTemporalISOQuery?: NativeQuery
}
const query = host.__formatjsTemporalISOQuery!
if (!query) throw new Error('Rust Temporal bridge missing')
delete host.__formatjsTemporalISOQuery
const fields = {
  year: 2020,
  month: 11,
  day: 1,
  hour: 1,
  minute: 30,
  nanosecond: 123,
}
const cached = ['America/New_York', 'US/Eastern', 'UTC', '+05:45'].map(id =>
  zonedKernel(id)
)
const clocks = ['UTC', '+05:45'].map(id => resolveTimeZone(id))
const existing = new Temporal.ZonedDateTime(0n, 'America/New_York')
for (const zone of cached) {
  zone.offsetNanoseconds(0n)
  zone.possibleInstants(fields)
  zone.resolve(fields)
  zone.transition(0n, 'next')
}
configureNativeTemporal(query)
const actions = [
  ...cached.flatMap(zone => [
    {operation: 'timeZoneOffset', run: () => zone.offsetNanoseconds(0n)},
    {
      operation: 'timeZonePossibleInstants',
      run: () => zone.possibleInstants(fields),
    },
    {operation: 'timeZoneResolve', run: () => zone.resolve(fields)},
    {operation: 'timeZoneTransition', run: () => zone.transition(0n, 'next')},
  ]),
  ...clocks.map(zone => ({
    operation: 'timeZoneOffset',
    run: () => zone.offsetNanoseconds(0n),
  })),
  {operation: 'timeZoneOffset', run: () => existing.offsetNanoseconds},
  {
    operation: 'timeZoneIdentity',
    run: () => timeZoneIdentifier('america/new_york'),
  },
  {
    operation: 'timeZoneIdentity',
    run: () => primaryTimeZoneIdentifier('US/Eastern'),
  },
]
for (const action of actions) {
  const before = JSON.parse(query('{"op":"info"}') as string).calls
  action.run()
  if (JSON.parse(query('{"op":"info"}') as string).calls <= before)
    throw new Error('Cached zone skipped Rust')
}
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
    if (!rejected) throw new Error('Cached zone fell back after native error')
  }
} finally {
  configureNativeTemporal(query)
}
print(
  JSON.stringify(
    checkTimezoneOracle(
      Temporal,
      __temporalTimezoneIdentityOracle.join('\n'),
      __temporalTimezoneOracle.join('\n'),
      __temporalTransitionOracle.join('\n'),
      (actual, expected, context) => {
        if (!Object.is(actual, expected))
          throw new Error(
            context + ': ' + String(actual) + ' !== ' + String(expected)
          )
      }
    )
  )
)
