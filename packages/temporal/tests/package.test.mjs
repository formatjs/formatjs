import assert from 'node:assert/strict'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'
import {Temporal as reference} from 'temporal-polyfill/implementation'

const directory = runfiles.resolve(process.argv[2])
const load = name => import(pathToFileURL(join(directory, name)).href)
const before = Object.getOwnPropertyDescriptor(globalThis, 'Temporal')
const dateBefore = Object.getOwnPropertyDescriptor(
  Date.prototype,
  'toTemporalInstant'
)
const owned = await load('index.js')
assert.deepEqual(
  Object.getOwnPropertyDescriptor(globalThis, 'Temporal'),
  before
)
assert.deepEqual(
  Object.getOwnPropertyDescriptor(Date.prototype, 'toTemporalInstant'),
  dateBefore
)
Object.defineProperty(globalThis, 'Temporal', {
  value: reference,
  configurable: true,
  writable: true,
})
Reflect.deleteProperty(Date.prototype, 'toTemporalInstant')
await load('polyfill.js')
assert.equal(globalThis.Temporal, reference)
assert(new Date(1).toTemporalInstant() instanceof reference.Instant)
await load('polyfill-force.js')
assert.equal(globalThis.Temporal, owned.Temporal)
assert.equal(Date.prototype.toTemporalInstant, owned.toTemporalInstant)
const value = new Date(1).toTemporalInstant()
assert(value instanceof owned.Instant)
assert(
  owned.Instant.prototype.equals.call(value, new owned.Instant(1_000_000n))
)
assert(Temporal.Now.instant() instanceof owned.Instant)
await load('polyfill-force.js')
assert.equal(globalThis.Temporal, owned.Temporal)
assert.equal(Date.prototype.toTemporalInstant, owned.toTemporalInstant)
const {shouldPolyfill} = await load('should-polyfill.js')
assert.equal(shouldPolyfill(), false)
