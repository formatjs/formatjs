import {Temporal} from '#packages/temporal/index.js'

function check(value: boolean): void {
  if (!value) throw new Error('Now host assertion failed')
}
check(typeof globalThis.Temporal === 'undefined')
check(typeof Date.prototype.toTemporalInstant === 'undefined')
const before = Date.now(),
  zoned = Temporal.Now.zonedDateTimeISO(),
  after = Date.now()
check(zoned.epochMilliseconds >= before && zoned.epochMilliseconds <= after)
const minutes = -new Date().getTimezoneOffset(),
  absolute = Math.abs(minutes)
const expected =
  minutes === 0
    ? 'UTC'
    : (minutes < 0 ? '-' : '+') +
      String(Math.floor(absolute / 60)).padStart(2, '0') +
      ':' +
      String(absolute % 60).padStart(2, '0')
check(Temporal.Now.timeZoneId() === expected)
check(zoned.offsetNanoseconds === minutes * 60_000_000_000)
check(Temporal.Now.plainDateTimeISO().calendarId === 'iso8601')
check(Temporal.Now.plainDateISO().calendarId === 'iso8601')
const beforeHour = new Date().getHours(),
  hour = Temporal.Now.plainTimeISO().hour,
  afterHour = new Date().getHours()
check(hour === beforeHour || hour === afterHour)
check(
  Temporal.Now.zonedDateTimeISO('America/New_York').timeZoneId ===
    'America/New_York'
)

const originalString = Object.getOwnPropertyDescriptor(globalThis, 'String')!,
  originalPadStart = Object.getOwnPropertyDescriptor(
    String.prototype,
    'padStart'
  )!,
  stringPrototype = String.prototype
for (const target of ['String', 'padStart']) {
  let calls = 0,
    failure: unknown,
    zone: string | undefined,
    completed = 0
  const poison = function (): never {
    calls++
    throw new Error('Mutable host offset formatting reached')
  }
  try {
    if (target === 'String')
      Object.defineProperty(globalThis, 'String', {
        ...originalString,
        value: poison,
      })
    else
      Object.defineProperty(stringPrototype, 'padStart', {
        ...originalPadStart,
        value: poison,
      })
    Temporal.Now.instant()
    Temporal.Now.zonedDateTimeISO('UTC')
    zone = Temporal.Now.timeZoneId()
    Temporal.Now.plainDateTimeISO()
    completed++
    Temporal.Now.zonedDateTimeISO()
    completed++
    Temporal.Now.plainDateISO()
    completed++
    Temporal.Now.plainTimeISO()
    completed++
  } catch (error) {
    failure = error
  } finally {
    Object.defineProperty(globalThis, 'String', originalString)
    Object.defineProperty(stringPrototype, 'padStart', originalPadStart)
  }
  if (failure !== undefined) throw failure
  check(calls === 0)
  check(zone === expected)
  check(completed === 4)
}
