import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {cpus} from 'node:os'
import {join} from 'node:path'
import {performance} from 'node:perf_hooks'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

const child = process.env.FORMATJS_DATE_BENCHMARK_CHILD === '1'
const directory = child ? process.argv[2] : runfiles.resolve(process.argv[2])
const profiles = ['native', 'installedExisting', 'installedNew'] as const
const iterations = 8192
const warmup = 1024
const cases = [
  ['en', 'gregory', 'UTC'],
  ['en', 'gregory', 'America/New_York'],
  ['fr', 'gregory', 'Europe/Paris'],
  ['en', 'hebrew', 'America/New_York'],
] as const
const dates = Array.from(
  {length: 8},
  (_, index) => new Date(Date.UTC(2024, index, 15, index + 1, 23, 45))
)
let sink = 0
if (child) {
  const profile = process.argv[3]
  const Native = Intl.DateTimeFormat
  const format = Object.getOwnPropertyDescriptor(
    Native.prototype,
    'format'
  )!.get!
  const parts = Native.prototype.formatToParts
  const create = () =>
    cases.map(
      ([locale, calendar, timeZone]) =>
        new Intl.DateTimeFormat(locale, {
          calendar,
          timeZone,
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hourCycle: 'h23',
          timeZoneName: 'short',
        })
    )
  const originals = create()
  const expected = originals.map(formatter =>
    dates.map(date => ({
      text: format.call(formatter)(date),
      parts: parts.call(formatter, date),
    }))
  )
  if (profile !== 'native') {
    assert.equal(
      globalThis.Temporal,
      undefined,
      'Benchmark requires absent native Temporal'
    )
    await import(pathToFileURL(join(directory, 'polyfill.js')).href)
    assert.notEqual(
      Intl.DateTimeFormat,
      Native,
      'Temporal installer must wrap host Intl'
    )
  }
  const formatters = profile === 'installedNew' ? create() : originals
  const results = []
  for (let index = 0; index < cases.length; index++) {
    const formatter = formatters[index]
    for (let input = 0; input < dates.length; input++) {
      assert.equal(formatter.format(dates[input]), expected[index][input].text)
      assert.deepEqual(
        formatter.formatToParts(dates[input]),
        expected[index][input].parts
      )
    }
    for (const method of ['format', 'formatToParts'] as const) {
      const operation =
        method === 'format'
          ? (date: Date) => formatter.format(date)
          : (date: Date) =>
              formatter
                .formatToParts(date)
                .map(part => part.value)
                .join('')
      const run = (count: number) => {
        let checksum = 0
        for (let call = 0; call < count; call++) {
          const text = operation(dates[call % dates.length])
          checksum = (checksum + text.length + text.charCodeAt(0)) | 0
        }
        sink ^= checksum
        return checksum
      }
      run(warmup)
      const start = performance.now()
      const checksum = run(iterations)
      const nanoseconds = ((performance.now() - start) * 1000000) / iterations
      results.push({
        name: cases[index].join('/') + '/' + method,
        nanoseconds,
        checksum,
      })
    }
  }
  process.stdout.write(JSON.stringify({results, sink}))
} else {
  const measurements = new Map<
    string,
    {nanoseconds: number[]; checksum: number}
  >()
  for (let round = 0; round < 9; round++) {
    for (let step = 0; step < profiles.length; step++) {
      const profile = profiles[(round + step) % profiles.length]
      const result = spawnSync(
        process.execPath,
        [process.argv[1], directory, profile],
        {
          encoding: 'utf8',
          timeout: 120000,
          env: {
            ...process.env,
            FORMATJS_DATE_BENCHMARK_CHILD: '1',
            NODE_DISABLE_COMPILE_CACHE: '1',
          },
        }
      )
      assert.equal(result.status, 0, result.stderr || result.error?.message)
      const output = JSON.parse(result.stdout) as {
        results: {name: string; nanoseconds: number; checksum: number}[]
      }
      for (const row of output.results) {
        const key = profile + ':' + row.name
        const samples = measurements.get(key) ?? {
          nanoseconds: [],
          checksum: row.checksum,
        }
        assert.equal(row.checksum, samples.checksum)
        samples.nanoseconds.push(row.nanoseconds)
        measurements.set(key, samples)
      }
    }
  }
  const median = (values: number[]) =>
    [...values].sort((one, two) => one - two)[4]
  const results = cases.flatMap(specification =>
    ['format', 'formatToParts'].map(method => {
      const name = specification.join('/') + '/' + method
      const baseline = measurements.get('native:' + name)!
      return {
        name,
        measurements: profiles.map(profile => {
          const samples = measurements.get(profile + ':' + name)!
          assert.equal(samples.checksum, baseline.checksum)
          return {
            profile,
            nanoseconds: median(samples.nanoseconds),
            relativeToNative:
              median(samples.nanoseconds) / median(baseline.nanoseconds),
            samples: samples.nanoseconds,
          }
        }),
      }
    })
  )
  process.stdout.write(
    JSON.stringify(
      {
        node: process.version,
        v8: process.versions.v8,
        icu: process.versions.icu,
        cpu: cpus()[0]?.model,
        iterations,
        warmup,
        method:
          'Nine fresh processes per profile in rotating order. Cached formatters, eight varying plain Date inputs. Existing formatters created before polyfill.js; new formatters after installation. Exact strings and parts checked against captured native methods. Hot timings exclude installation/construction. format includes bound getter access; formatToParts includes identical parts joining/checksum in all profiles. No constructor, startup, heap, range or Hermes performance claim.',
        results,
      },
      null,
      2
    ) + '\n'
  )
}
