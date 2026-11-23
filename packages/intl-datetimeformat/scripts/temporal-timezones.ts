import {readFile, writeFile} from 'node:fs/promises'
import minimist from 'minimist'
import {UnpackTimeZoneData} from '#packages/ecma402-abstract/DateTimeFormat/UnpackTimeZoneData.js'
import {TimeZoneRuleTransition} from '#packages/ecma402-abstract/DateTimeFormat/TimeZoneOffset.js'
import type {
  PackedTimeZoneData,
  TimeZoneFutureRule,
  TimeZoneTransitionRule,
} from '#packages/ecma402-abstract/types/date-time.js'

interface Args extends minimist.ParsedArgs {
  input: string
  out: string
  namesOnly?: boolean
}
interface Event {
  timestamp: number
  offset: number
  year: number
}
interface Run {
  rule: TimeZoneTransitionRule
  events: number[]
  key: string
}
type Zone = [number, number, number[], number[]]
const monthStarts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

function patterns(event: Event): TimeZoneTransitionRule[] {
  const date = new Date(event.timestamp * 1000),
    month = date.getUTCMonth() + 1,
    day = date.getUTCDate(),
    weekday = date.getUTCDay(),
    seconds =
      date.getUTCHours() * 3600 +
      date.getUTCMinutes() * 60 +
      date.getUTCSeconds(),
    last = new Date(Date.UTC(event.year, month, 0)).getUTCDate(),
    week = Math.floor((day - 1) / 7) + 1
  const values: TimeZoneTransitionRule[] = [
    {kind: 'month', month, week, weekday, seconds},
  ]
  if (day + 7 > last && week !== 5)
    values.push({kind: 'month', month, week: 5, weekday, seconds})
  if (!(month === 2 && day === 29))
    values.push({kind: 'julian', day: monthStarts[month - 1] + day, seconds})
  return values
}

async function main(args: Args) {
  if (args.namesOnly) {
    const source = JSON.parse(
      await readFile(args.input, 'utf8')
    ) as PackedTimeZoneData
    const unpacked = UnpackTimeZoneData(source)
    const names = Object.keys(unpacked).sort()
    const steps: Record<string, number> = {}
    let lastExplicitTransition = 0
    for (const name of names) {
      const data = unpacked[name],
        events: number[] = []
      lastExplicitTransition = Math.max(
        lastExplicitTransition,
        data[data.length - 1][0]
      )
      for (let index = 1; index < data.length; index++)
        if (data[index][2] !== data[index - 1][2]) events.push(data[index][0])
      const future = data.future
      if (
        future?.start &&
        future.end &&
        future.daylightOffset !== undefined &&
        future.daylightOffset !== future.standardOffset
      ) {
        const firstYear = events.length
          ? new Date(events[events.length - 1] * 1000).getUTCFullYear() + 1
          : 2000
        for (let year = firstYear; year <= firstYear + 401; year++) {
          events.push(
            TimeZoneRuleTransition(year, future.start) - future.standardOffset
          )
          events.push(
            TimeZoneRuleTransition(year, future.end) - future.daylightOffset
          )
        }
      }
      events.sort((one, two) => one - two)
      let step = 60 * 86400
      for (let index = 1; index < events.length; index++) {
        const gap = events[index] - events[index - 1]
        if (gap > 0) step = Math.min(step, Math.max(1, Math.floor(gap / 2)))
      }
      if (step < 60 * 86400) steps[name] = step
    }
    await writeFile(
      args.out,
      `// Generated IANA identifiers, sampling intervals and last explicit transition in seconds.\nexport default ${JSON.stringify(names)} as const\nexport const steps: Readonly<Record<string, number>> = ${JSON.stringify(steps)}\nexport const lastExplicitTransition = ${lastExplicitTransition}\n`
    )
    return
  }
  const source = UnpackTimeZoneData(
      JSON.parse(await readFile(args.input, 'utf8')) as PackedTimeZoneData
    ),
    offsets: number[] = [],
    rules: TimeZoneTransitionRule[] = [],
    futures: TimeZoneFutureRule[] = [],
    ruleIds = new Map<string, number>(),
    futureIds = new Map<string, number>(),
    zones: Record<string, Zone> = {}
  const stats = {
    zones: 0,
    sourceRows: 0,
    offsetRows: 0,
    fixedEvents: 0,
    spans: 0,
  }
  const offsetId = (value: number): number => {
    let index = offsets.indexOf(value)
    if (index < 0) index = offsets.push(value) - 1
    return index
  }
  for (const name of Object.keys(source).sort()) {
    const data = source[name],
      events: Event[] = []
    for (let index = 1; index < data.length; index++) {
      if (index !== data.length - 1 && data[index][2] === data[index - 1][2])
        continue
      const [timestamp, , offset] = data[index],
        year = new Date(timestamp * 1000).getUTCFullYear()
      if (!Number.isInteger(year) || year < 100)
        throw new Error(`Unsupported transition year: ${name}`)
      events.push({timestamp, offset, year})
    }
    const candidates = new Map<string, Run>()
    for (let index = 0; index < events.length; index++) {
      for (const rule of patterns(events[index])) {
        if (
          TimeZoneRuleTransition(events[index].year, rule) !==
          events[index].timestamp
        )
          throw new Error(`Invalid inferred rule: ${name}`)
        const key = JSON.stringify([rule, events[index].offset])
        let run = candidates.get(key)
        if (!run) candidates.set(key, (run = {rule, events: [], key}))
        run.events.push(index)
      }
    }
    const opportunities: Run[] = []
    for (const candidate of candidates.values()) {
      let run: number[] = []
      const flush = () => {
        if (run.length >= 3) opportunities.push({...candidate, events: run})
        run = []
      }
      for (const index of candidate.events) {
        if (
          run.length &&
          events[index].year !== events[run[run.length - 1]].year + 1
        )
          flush()
        run.push(index)
      }
      flush()
    }
    opportunities.sort(
      (one, two) =>
        two.events.length - one.events.length ||
        (one.key < two.key ? -1 : one.key > two.key ? 1 : 0)
    )
    const assigned = new Set<number>(),
      recurring: number[] = []
    for (const candidate of opportunities) {
      let run: number[] = []
      const flush = () => {
        if (run.length >= 3) {
          const key = JSON.stringify(candidate.rule)
          let rule = ruleIds.get(key)
          if (rule === undefined) {
            rule = rules.push(candidate.rule) - 1
            ruleIds.set(key, rule)
          }
          recurring.push(
            events[run[0]].year,
            events[run[run.length - 1]].year,
            rule,
            offsetId(events[run[0]].offset)
          )
          for (const index of run) assigned.add(index)
        }
        run = []
      }
      for (const index of candidate.events) {
        if (assigned.has(index)) {
          flush()
          continue
        }
        if (
          run.length &&
          events[index].year !== events[run[run.length - 1]].year + 1
        )
          flush()
        run.push(index)
      }
      flush()
    }
    const fixed: number[] = []
    for (let index = 0; index < events.length; index++)
      if (!assigned.has(index))
        fixed.push(events[index].timestamp, offsetId(events[index].offset))
    let future = -1
    if (data.future) {
      const key = JSON.stringify(data.future),
        known = futureIds.get(key)
      if (known !== undefined) future = known
      else {
        future = futures.push(data.future) - 1
        futureIds.set(key, future)
      }
    }
    const reconstructed: [number, number][] = []
    for (let index = 0; index < fixed.length; index += 2)
      reconstructed.push([fixed[index], offsets[fixed[index + 1]]])
    for (let index = 0; index < recurring.length; index += 4)
      for (let year = recurring[index]; year <= recurring[index + 1]; year++)
        reconstructed.push([
          TimeZoneRuleTransition(year, rules[recurring[index + 2]]),
          offsets[recurring[index + 3]],
        ])
    reconstructed.sort((one, two) => one[0] - two[0])
    if (
      JSON.stringify(reconstructed) !==
      JSON.stringify(events.map(event => [event.timestamp, event.offset]))
    )
      throw new Error(`Transition reconstruction failed: ${name}`)
    zones[name] = [offsetId(data[0][2]), future, fixed, recurring]
    stats.zones++
    stats.sourceRows += data.length
    stats.offsetRows += events.length
    stats.fixedEvents += fixed.length / 2
    stats.spans += recurring.length / 4
  }
  await writeFile(
    args.out,
    `// Generated from pinned IANA transitions; every finite offset event is verified.\nimport type {TimeZoneFutureRule, TimeZoneTransitionRule} from '#packages/ecma402-abstract/types/date-time.js';\nexport const compact: {offsets: number[]; rules: TimeZoneTransitionRule[]; futures: TimeZoneFutureRule[]; zones: Record<string, [number, number, number[], number[]]>; stats: {zones: number; sourceRows: number; offsetRows: number; fixedEvents: number; spans: number}} = ${JSON.stringify({offsets, rules, futures, zones, stats})};\n`
  )
}
if (import.meta.filename === process.argv[1])
  await main(minimist(process.argv.slice(2)) as Args)
