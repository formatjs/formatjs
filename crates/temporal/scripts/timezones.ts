import {writeFileSync} from 'node:fs'
import minimist from 'minimist'
import packed from '@formatjs_generated/tz/all-tz.js'
import primary from '@formatjs_generated/tz/primary.js'
import type {
  PackedTimeZoneData,
  TimeZoneFutureRule,
  TimeZoneTransitionRule,
} from '#packages/ecma402-abstract/types/date-time.js'

interface Args extends minimist.ParsedArgs {
  out: string
}
function integer(value: number): string {
  if (!Number.isSafeInteger(value)) throw new Error('Invalid timezone integer')
  return String(value)
}
function base36(value: string): number {
  if (!/^-?[0-9a-z]+$/.test(value)) throw new Error('Invalid timezone base36')
  const number = Number.parseInt(value, 36)
  integer(number)
  return number
}
function index(value: string, maximum: number): number {
  if (!/^(?:0|[1-9][0-9]*)$/.test(value))
    throw new Error('Invalid timezone index')
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number >= maximum)
    throw new Error('Timezone index out of range')
  return number
}
function rule(value: TimeZoneTransitionRule): string {
  if (value.kind === 'month')
    return `TransitionRule::Month { month: ${integer(value.month)}, week: ${integer(value.week)}, weekday: ${integer(value.weekday)}, seconds: ${integer(value.seconds)} }`
  return `TransitionRule::${value.kind === 'day' ? 'Day' : 'Julian'} { day: ${integer(value.day)}, seconds: ${integer(value.seconds)} }`
}
function future(value: TimeZoneFutureRule | undefined): string {
  if (value === undefined) return 'None'
  let daylight = 'None'
  if (value.daylightOffset !== undefined) {
    if (!value.start || !value.end)
      throw new Error('Missing timezone future rule')
    daylight = `Some((${integer(value.daylightOffset)}, ${rule(value.start)}, ${rule(value.end)}))`
  } else if (value.start || value.end)
    throw new Error('Unexpected timezone future rule')
  return `Some(checked_future(${integer(value.standardOffset)}, ${daylight}))`
}
function main(args: Args): void {
  if (!args.out) throw new Error('--out required')
  const data: PackedTimeZoneData = packed
  const offsets = data.offsets.split('|').map(base36)
  const abbreviations = data.abbrvs.split('|')
  const names = new Set<string>()
  const rows: [string, string][] = []
  for (const packedZone of data.zones) {
    const [name, ...parts] = packedZone.split('|')
    if (!name || !/^[A-Za-z0-9._+/-]+$/.test(name) || names.has(name))
      throw new Error('Invalid or duplicate timezone name')
    names.add(name)
    let initial: number | undefined
    let previous = -Infinity
    const transitions: string[] = []
    for (const [position, part] of parts.entries()) {
      const fields = part.split(',')
      if (fields.length !== 4) throw new Error('Invalid timezone transition')
      const [timestamp, abbreviation, offset, dst] = fields
      index(abbreviation, abbreviations.length)
      const seconds = offsets[index(offset, offsets.length)]
      if (dst !== '0' && dst !== '1')
        throw new Error('Invalid timezone DST flag')
      if (position === 0) {
        if (timestamp !== '') throw new Error('Missing timezone initial offset')
        initial = seconds
      } else {
        const epoch = base36(timestamp)
        if (epoch <= previous) throw new Error('Unsorted timezone transitions')
        previous = epoch
        transitions.push(
          `OffsetTransition { epoch_seconds: ${integer(epoch)}, offset_seconds: ${integer(seconds)} }`
        )
      }
    }
    if (initial === undefined) throw new Error('Empty timezone record')
    const canonical = primary[name as keyof typeof primary] ?? name
    if (canonical === 'UTC' || canonical !== name) continue
    rows.push([
      name,
      `TimeZoneRecord { identifier: ${JSON.stringify(name)}, provider: checked_zone(${integer(initial)}, &[${transitions.join(',')}], ${future(data.future?.[name])}) }`,
    ])
  }
  if (Object.keys(data.future ?? {}).some(name => !names.has(name)))
    throw new Error('Orphan timezone future rule')
  rows.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  writeFileSync(
    args.out,
    `// @generated from pinned @formatjs_generated/tz; do not edit.\npub(super) static ZONES: &[TimeZoneRecord<'static>] = &[\n${rows.map(([, value]) => value + ',').join('\n')}\n];\n`
  )
}
if (import.meta.filename === process.argv[1])
  main(minimist<Args>(process.argv.slice(2)))
