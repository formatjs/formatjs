// Bounded supported-runtime endpoint evidence; no production polyfill execution.
import {readFileSync, writeFileSync} from 'node:fs'
const [input, output] = process.argv.slice(2)
if (!input || !output)
  throw Error('Usage: node host.mjs generated-result.json output.json')
const generated = JSON.parse(readFileSync(input, 'utf8'))
const limit = 8640000000000000000000n,
  day = 86400000000000n,
  window = 2n * day,
  cycle = 146097n * day
const rows = [],
  failures = []
function offset(formatter, nanos) {
  const part = formatter
    .formatToParts(Number(nanos / 1000000n))
    .find(p => p.type === 'timeZoneName').value
  const m = /^GMT(?:([+-])(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(part)
  if (!m) throw Error('Unexpected host offset ' + part)
  return m[1]
    ? BigInt(m[1] === '-' ? -1 : 1) *
        BigInt(Number(m[2]) * 3600 + Number(m[3]) * 60 + Number(m[4] ?? 0)) *
        1000000000n
    : 0n
}
function nearest(zone, epoch, direction) {
  const t = new Temporal.ZonedDateTime(epoch, zone).getTimeZoneTransition(
    direction
  )
  if (!t) return null
  const at = t.epochNanoseconds,
    before = new Temporal.ZonedDateTime(at - 1n, zone).offsetNanoseconds,
    after = t.offsetNanoseconds
  return {
    epoch: at,
    before,
    after,
    negative: after < before,
    distance: at >= epoch ? at - epoch : epoch - at,
  }
}
for (const {zone} of generated.packed_endpoint_rows) {
  let formatter
  try {
    formatter = new Intl.DateTimeFormat('en-US-u-nu-latn', {
      timeZone: zone,
      timeZoneName: 'longOffset',
    })
  } catch (error) {
    rows.push({zone, intl_unavailable: error.name})
    continue
  }
  const lowerNext = nearest(zone, -limit, 'next'),
    upperPrevious = nearest(zone, limit, 'previous')
  const mappedUpper = limit - cycle,
    mappedLower = -limit + cycle
  const mappedUpperPrevious = nearest(zone, mappedUpper, 'previous'),
    mappedUpperNext = nearest(zone, mappedUpper, 'next')
  const mappedLowerPrevious = nearest(zone, mappedLower, 'previous'),
    mappedLowerNext = nearest(zone, mappedLower, 'next')
  for (const [name, t] of Object.entries({
    lowerNext,
    upperPrevious,
    mappedUpperPrevious,
    mappedUpperNext,
    mappedLowerPrevious,
    mappedLowerNext,
  }))
    if (t && t.distance <= window)
      failures.push({zone, kind: 'transition_in_window', name, transition: t})
  const observed = []
  for (const edge of [-1n, 1n])
    for (const delta of [0n, day, window]) {
      const at = edge < 0n ? -limit + delta : limit - delta,
        mapped = edge < 0n ? at + cycle : at - cycle
      const intl = offset(formatter, at),
        shifted = offset(formatter, mapped),
        native = new Temporal.ZonedDateTime(at, zone).offsetNanoseconds
      if (intl !== shifted || intl !== BigInt(native))
        failures.push({
          zone,
          kind: 'endpoint_offset_disagreement',
          at,
          intl,
          shifted,
          native,
        })
      if (intl <= -day || intl >= day)
        failures.push({zone, kind: 'offset_bound'})
      observed.push({
        epoch: at,
        intl_offset: intl,
        mapped_epoch: mapped,
        mapped_offset: shifted,
        native_offset: native,
      })
    }
  rows.push({
    zone,
    lowerNext,
    upperPrevious,
    mappedUpperPrevious,
    mappedUpperNext,
    mappedLowerPrevious,
    mappedLowerNext,
    observed,
  })
}
const result = {
  runtime: {
    node: process.version,
    icu: process.versions.icu,
    tz: process.versions.tz,
  },
  window_nanoseconds: window,
  cycle_nanoseconds: cycle,
  zones_requested: rows.length,
  zones_available: rows.filter(r => !r.intl_unavailable).length,
  failures,
  rows,
}
writeFileSync(
  output,
  JSON.stringify(result, (_, v) => (typeof v === 'bigint' ? String(v) : v), 2) +
    '\n'
)
console.log(
  JSON.stringify({
    runtime: result.runtime,
    zones: rows.length,
    available: result.zones_available,
    failures: failures.length,
  })
)
