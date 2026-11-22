import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

const packageDir = process.argv[2]
const modes = [
  'ceil',
  'floor',
  'expand',
  'trunc',
  'halfCeil',
  'halfFloor',
  'halfExpand',
  'halfTrunc',
  'halfEven',
]
const cases = [
  ['month', '2020-09-25T01:30-04:00[America/New_York]'],
  ['year', '2019-10-25T01:30-04:00[America/New_York]'],
]
const importTemporal = async entry =>
  (await import(pathToFileURL(resolve(packageDir, entry)).href)).Temporal
const profiles = {
  host: await importTemporal('index.js'),
  standalone: await importTemporal('standalone.js'),
  native: globalThis.Temporal,
}
const rows = []
for (const [profile, Temporal] of Object.entries(profiles)) {
  for (const [largestUnit, input] of cases) {
    const prefix = {[largestUnit + 's']: 1}
    const origin = Temporal.ZonedDateTime.from(input)
    const duration = Temporal.Duration.from({
      ...prefix,
      days: 6,
      hours: 24,
      minutes: 30,
    })
    const a = origin.add(prefix).epochNanoseconds
    const b = origin.add({...prefix, weeks: 1}).epochNanoseconds
    const target = origin.add(duration).epochNanoseconds
    const values = modes.map(roundingMode =>
      duration
        .round({
          relativeTo: origin,
          largestUnit,
          smallestUnit: 'week',
          roundingMode,
        })
        .toString()
    )
    rows.push({
      profile,
      largestUnit,
      a: a.toString(),
      b: b.toString(),
      target: target.toString(),
      originalDistance: (target - a).toString(),
      originalSpan: (b - a).toString(),
      rounded: Object.fromEntries(
        modes.map((mode, index) => [mode, values[index]])
      ),
    })
  }
}
const packageSHA256 = {}
for (const entry of ['index.js', 'standalone.js', 'native.js']) {
  packageSHA256[entry] = createHash('sha256')
    .update(await readFile(resolve(packageDir, entry)))
    .digest('hex')
}
console.log(
  JSON.stringify(
    {
      node: process.versions.node,
      icu: process.versions.icu,
      packageSHA256,
      rows,
    },
    null,
    2
  )
)
