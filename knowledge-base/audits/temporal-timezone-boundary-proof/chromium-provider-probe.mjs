import {Temporal as Polyfill} from './pkg/index.js'
const Native = globalThis.Temporal
if (!Native)
  throw new Error('Native Temporal is required for the browser comparison')
const zones = Intl.supportedValuesOf('timeZone')
const result = {
  ua: navigator.userAgent,
  zones: zones.length,
  native: !!Native,
  checks: {},
  mismatches: [],
}
const compare = (type, parameters, actual, expected) => {
  result.checks[type] = (result.checks[type] || 0) + 1
  if (String(actual) !== String(expected))
    result.mismatches.push({
      type,
      parameters,
      actual: String(actual),
      expected: String(expected),
    })
}
const limit = 8_640_000_000_000_000_000_000n
const seconds = 1_000_000_000n
const epochs = [
  -limit,
  limit,
  -3944631116n * seconds,
  -2208988800n * seconds,
  0n,
  1710054000n * seconds - 1n,
  1770000000n * seconds,
  3703456800n * seconds,
]
for (const zone of zones) {
  for (const instant of epochs) {
    const actual = new Polyfill.ZonedDateTime(instant, zone)
    const expected = new Native.ZonedDateTime(instant, zone)
    compare('offset', [zone, String(instant)], actual.offset, expected.offset)
  }
  const anchor = new Native.ZonedDateTime(1710054000n * seconds, zone)
  const next = anchor.getTimeZoneTransition('next')?.epochNanoseconds
  if (next !== undefined) {
    compare(
      'next',
      [zone, String(next)],
      new Polyfill.ZonedDateTime(next - 1n, zone).getTimeZoneTransition('next')
        ?.epochNanoseconds,
      next
    )
    compare(
      'previous',
      [zone, String(next)],
      new Polyfill.ZonedDateTime(next + 1n, zone).getTimeZoneTransition(
        'previous'
      )?.epochNanoseconds,
      next
    )
  }
}
const controls = [
  ['Africa/Casablanca', '2100-01-01T00:00', 'previous'],
  ['Africa/El_Aaiun', '2100-01-01T00:00', 'previous'],
  ['Asia/Gaza', '2100-01-01T00:00', 'previous'],
  ['Asia/Hebron', '2100-01-01T00:00', 'previous'],
  ['America/Cambridge_Bay', '2000-10-29T02:00', 'next'],
  ['Brazil/DeNoronha', '2000-10-07T23:30', 'next'],
]
for (const [zone, local, direction] of controls) {
  const input = local + '[' + zone + ']'
  compare(
    'history',
    input,
    Polyfill.ZonedDateTime.from(input).getTimeZoneTransition(direction)
      ?.epochNanoseconds,
    Native.ZonedDateTime.from(input).getTimeZoneTransition(direction)
      ?.epochNanoseconds
  )
}
for (const [zone, time] of [
  ['America/New_York', '2024-03-10T02:30'],
  ['America/New_York', '2024-11-03T01:30'],
  ['Australia/Lord_Howe', '2024-04-07T01:45'],
  ['Pacific/Apia', '2011-12-30T12:00'],
]) {
  for (const disambiguation of ['earlier', 'later', 'compatible', 'reject']) {
    const input = time + '[' + zone + ']'
    const read = ({ZonedDateTime}) => {
      try {
        return ZonedDateTime.from(input, {disambiguation}).epochNanoseconds
      } catch (e) {
        return e.name
      }
    }
    compare('gapFold', [input, disambiguation], read(Polyfill), read(Native))
  }
}
document.querySelector('#result').textContent = JSON.stringify(result)
