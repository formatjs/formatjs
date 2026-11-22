import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

const [mode, packagePath, hermes, hermesResult] = process.argv.slice(2)
const force = resolve(packagePath, 'polyfill-force.js')
const sha256 = input => createHash('sha256').update(input).digest('hex')
assert.equal(
  sha256(readFileSync(force)),
  '6b0cf18a501f61f6ef5c63de741ea1e0b41b006c39c2d86c2d68f697001ac34f'
)
const native = Intl.DateTimeFormat
await import(pathToFileURL(force).href)
const released = Intl.DateTimeFormat
assert.notEqual(released, native)
const show = Function.prototype.call.bind(Function.prototype.toString)
const constructorSource = show(released)
const partsSource = show(released.prototype.formatToParts)
assert.equal(
  sha256(constructorSource),
  '58fa2babd35f0e6e71ae0311e85b9a1d4799f48d2a422ca4790fd79eb16d3981'
)
assert.equal(
  sha256(partsSource),
  'e2251cc95c6d7d84fca05ed390918216933594853371ab4e8863cd9898d27053'
)

function examine(released, parts, native, expected, expectedParts) {
  const show = Function.prototype.call.bind(Function.prototype.toString)
  const events = []
  const handler = {
    get(target, key, receiver) {
      events.push('get ' + String(key))
      return Reflect.get(target, key, receiver)
    },
    getOwnPropertyDescriptor(target, key) {
      events.push('descriptor ' + String(key))
      return Reflect.getOwnPropertyDescriptor(target, key)
    },
  }
  const proxy = new Proxy(released, handler)
  const revoked = Proxy.revocable(released, handler)
  revoked.revoke()
  const render = fn => {
    try {
      return show(fn)
    } catch (error) {
      return error.name
    }
  }
  const constructorText = render(released)
  const partsText = render(parts)
  const result = {
    constructor:
      constructorText === expected ? 'exact source' : constructorText,
    parts: partsText === expectedParts ? 'exact source' : partsText,
    proxy: render(proxy),
    revoked: render(revoked.proxy),
    native: render(native),
    bound: render(released.bind(null)),
    reflectionEvents: events.slice(),
  }
  Object.getOwnPropertyDescriptor(proxy, 'tzData')
  return {
    ...result,
    descriptorControl: events.slice(result.reflectionEvents.length),
  }
}

if (mode === 'fixture') {
  // Hermes evaluates the exact source expressions independently of packaging.
  console.log(`
var native = Intl.DateTimeFormat;
var DateTimeFormat = ${constructorSource};
var parts = ({${partsSource}}).formatToParts;
print(JSON.stringify((${show(examine)})(
  DateTimeFormat, parts, native, ${JSON.stringify(constructorSource)}, ${JSON.stringify(partsSource)}
)));
`)
  process.exit(0)
}
assert.equal(mode, 'verify')
const node = examine(
  released,
  released.prototype.formatToParts,
  native,
  constructorSource,
  partsSource
)
const runHermes = JSON.parse(readFileSync(hermesResult, 'utf8'))

assert.equal(node.constructor, 'exact source')
assert.equal(node.parts, 'exact source')
for (const key of ['proxy', 'revoked', 'native', 'bound'])
  assert.match(node[key], /\[native code\]/)
assert.deepEqual(node.reflectionEvents, [])
assert.deepEqual(node.descriptorControl, ['descriptor tzData'])
assert.match(runHermes.constructor, /\[bytecode\]/)
assert.match(runHermes.parts, /\[bytecode\]/)
assert.match(runHermes.native, /\[bytecode\]/)
assert.deepEqual(runHermes.reflectionEvents, ['get name'])
assert.deepEqual(runHermes.descriptorControl, ['descriptor tzData'])
assert.equal(runHermes.revoked, 'TypeError')

console.log(
  JSON.stringify(
    {
      nodeVersion: process.version,
      nodeSha256: sha256(readFileSync(process.execPath)),
      hermesSha256: sha256(readFileSync(resolve(hermes))),
      node,
      hermes: runHermes,
    },
    null,
    2
  )
)
