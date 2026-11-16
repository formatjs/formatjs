import assert from 'node:assert/strict'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

const directory = runfiles.resolve(process.argv[2])
const formatterDirectory = runfiles.resolve(process.argv[3])
const load = (directory, file) =>
  import(pathToFileURL(join(directory, file)).href)
const {DurationFormat} = await load(formatterDirectory, 'index.js')
const ownedFormatter = new DurationFormat('en', {style: 'digital'})
const Native = Intl.DurationFormat
const nativeFormatter = new Native('en', {style: 'digital'})
const {Temporal} = await load(directory, 'index.js')
const {Temporal: standalone} = await load(directory, 'standalone.js')
assert.notEqual(Temporal.Duration, standalone.Duration)
await load(directory, 'polyfill-force.js')

for (const Constructor of [DurationFormat, Native]) {
  const formatter = Constructor === Native ? nativeFormatter : ownedFormatter
  for (const namespace of [Temporal, standalone]) {
    Constructor.__addTemporalNamespace(namespace)
    const duration = namespace.Duration.from('PT1H2M3.004005006S')
    const descriptors = Object.getOwnPropertyDescriptors(
      namespace.Duration.prototype
    )
    const from = Object.getOwnPropertyDescriptor(namespace.Duration, 'from')
    try {
      Object.defineProperty(namespace.Duration, 'from', {
        get() {
          throw new Error('public parser')
        },
      })
      for (const field of [
        'years',
        'months',
        'weeks',
        'days',
        'hours',
        'minutes',
        'seconds',
        'milliseconds',
        'microseconds',
        'nanoseconds',
      ])
        Object.defineProperty(namespace.Duration.prototype, field, {
          get() {
            throw new Error('public getter')
          },
        })
      Constructor.__addTemporalNamespace(namespace)
      assert.equal(formatter.format(duration), '1:02:03.004005006')
      assert.equal(formatter.format('PT1H2M3.004005006S'), '1:02:03.004005006')
      assert.equal(
        formatter
          .formatToParts(duration)
          .map(part => part.value)
          .join(''),
        '1:02:03.004005006'
      )
    } finally {
      Object.defineProperties(namespace.Duration.prototype, descriptors)
      Object.defineProperty(namespace.Duration, 'from', from)
    }
  }
}
