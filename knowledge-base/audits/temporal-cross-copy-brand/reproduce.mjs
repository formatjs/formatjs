import vm from 'node:vm'
import {readFile} from 'node:fs/promises'
import {realpathSync} from 'node:fs'
import {resolve, dirname} from 'node:path'
import {createHash} from 'node:crypto'
import {pathToFileURL} from 'node:url'

const packageDir = realpathSync(process.argv[2])
const files = new Map()
async function realm(polyfill, context = vm.createContext({})) {
  if (polyfill) {
    const modules = new Map()
    async function load(path) {
      if (modules.has(path)) return modules.get(path)
      const source = await readFile(path, 'utf8')
      files.set(
        path.slice(packageDir.length + 1),
        createHash('sha256').update(source).digest('hex')
      )
      const mod = new vm.SourceTextModule(source, {context, identifier: path})
      modules.set(path, mod)
      return mod
    }
    const entry = await load(resolve(packageDir, 'polyfill-force.js'))
    await entry.link((specifier, mod) => {
      if (!specifier.startsWith('.'))
        throw Error('Unexpected dependency ' + specifier)
      return load(resolve(dirname(mod.identifier), specifier))
    })
    await entry.evaluate()
  }
  return {context, T: vm.runInContext('Temporal', context)}
}
const nanoseconds = 1234567890123456789n
function observe(label, call, reads) {
  let outcome
  try {
    outcome = {value: call()}
  } catch (error) {
    outcome = {
      error: error.name,
      message: error.message,
      thrown: typeof error === 'string' ? error : undefined,
    }
  }
  return {label, ...outcome, reads: [...reads]}
}
function controls(source, target) {
  const src = source.T
  const dst = target.T
  const result = []
  for (const [kind, input] of [
    ['Instant', new src.Instant(nanoseconds)],
    ['ZonedDateTime', new src.ZonedDateTime(nanoseconds, '+00:00', 'gregory')],
  ]) {
    const reads = []
    Object.defineProperty(input, Symbol.toPrimitive, {
      get() {
        reads.push('Symbol.toPrimitive')
        throw 'unexpected primitive hook'
      },
    })
    result.push(
      observe(
        'Instant.from ' + kind,
        () => dst.Instant.from(input).epochNanoseconds.toString(),
        reads
      )
    )
  }
  {
    const reads = []
    const foreignDate = new src.PlainDate(2024, 1, 2, 'gregory')
    for (const key of ['calendarId', 'calendar'])
      Object.defineProperty(foreignDate, key, {
        get() {
          reads.push(key)
          throw 'unexpected ' + key
        },
      })
    result.push(
      observe(
        'PlainDate.withCalendar foreign date',
        () =>
          new dst.PlainDate(2024, 1, 2).withCalendar(foreignDate).calendarId,
        reads
      )
    )
    reads.length = 0
    result.push(
      observe(
        'PlainYearMonth.from foreign date',
        () => dst.PlainYearMonth.from(foreignDate).calendarId,
        reads
      )
    )
  }
  return result
}
const nativeA = await realm(false),
  nativeB = await realm(false)
const polyA = await realm(true),
  polyB = await realm(true)
const duplicateContext = vm.createContext({})
const copyA = await realm(true, duplicateContext),
  copyB = await realm(true, duplicateContext)
const nativeEpoch = Object.getOwnPropertyDescriptor(
  nativeA.T.Instant.prototype,
  'epochNanoseconds'
).get
const producerEpoch = Object.getOwnPropertyDescriptor(
  polyB.T.Instant.prototype,
  'epochNanoseconds'
).get
const genuine = new polyB.T.Instant(nanoseconds)
Object.setPrototypeOf(genuine, null)
Object.freeze(genuine)
const forgery = Object.freeze(Object.create(null))
const observations = [genuine, forgery].map(input => ({
  ownKeys: Reflect.ownKeys(input),
  proto: Object.getPrototypeOf(input),
  type: Object.prototype.toString.call(input),
  extensible: Object.isExtensible(input),
  nativeBrand: observe(
    'native intrinsic',
    () => nativeEpoch.call(input).toString(),
    []
  ),
  producerBrand: observe(
    'captured producer intrinsic',
    () => producerEpoch.call(input).toString(),
    []
  ),
}))
function proxyInput() {
  const reads = []
  const input = new Proxy(
    {},
    {
      get(_target, key) {
        reads.push(typeof key === 'symbol' ? key.toString() : key)
        if (key === Symbol.toPrimitive) return () => '1970-01-01T00:00Z'
        if (key === 'calendar') return 'iso8601'
        if (key === 'year') return 2024
        if (key === 'month') return 1
      },
      getPrototypeOf() {
        reads.push('getPrototypeOf')
        throw 'unexpected discovery'
      },
      getOwnPropertyDescriptor() {
        reads.push('getOwnPropertyDescriptor')
        throw 'unexpected discovery'
      },
      ownKeys() {
        reads.push('ownKeys')
        throw 'unexpected discovery'
      },
      has() {
        reads.push('has')
        throw 'unexpected discovery'
      },
    }
  )
  return {input, reads}
}
const traces = []
for (const [name, T] of [
  ['native', nativeA.T],
  ['owned', polyA.T],
]) {
  for (const [label, call] of [
    ['Instant.from', v => T.Instant.from(v).epochNanoseconds.toString()],
    [
      'withCalendar',
      v => new T.PlainDate(2024, 1, 2).withCalendar(v).calendarId,
    ],
    ['PlainYearMonth.from', v => T.PlainYearMonth.from(v).calendarId],
  ]) {
    const {input, reads} = proxyInput()
    traces.push(observe(name + ' ' + label, () => call(input), reads))
  }
}
for (const [label, call] of [
  ['prototype discovery', v => Object.getPrototypeOf(v)],
  [
    'descriptor discovery',
    v => Object.getOwnPropertyDescriptor(v, Symbol.for('formatjs.example')),
  ],
]) {
  const {input, reads} = proxyInput()
  traces.push(observe(label, () => call(input), reads))
}
const formatter = vm.runInContext(
  "new Intl.DateTimeFormat('en',{ timeZone: 'UTC', year:'numeric', month:'2-digit', day:'2-digit' })",
  polyA.context
)
const register = vm.runInContext(
  'Intl.DateTimeFormat.__addTemporalNamespace',
  polyA.context
)
const formattingDate = new polyB.T.PlainDate(2024, 1, 2)
const formatReads = []
Object.defineProperty(formattingDate, Symbol.toPrimitive, {
  get() {
    formatReads.push('Symbol.toPrimitive')
    throw 'unexpected formatting hook'
  },
})
const beforeRegistration = observe(
  'unregistered formatter',
  () => formatter.format(formattingDate),
  formatReads
)
formatReads.length = 0
register(polyB.T)
const afterRegistration = observe(
  'explicitly registered formatter',
  () => formatter.format(formattingDate),
  formatReads
)
const importEntry = entry =>
  import(pathToFileURL(resolve(packageDir, entry)).href)
const index = await importEntry('index.js')
const standalone = await importEntry('standalone.js')
const original = globalThis.Temporal
await importEntry('polyfill.js')
const nativePreserved = globalThis.Temporal === original
await importEntry('polyfill-force.js')
for (const entry of ['standalone.js', 'polyfill.js']) {
  const bytes = await readFile(resolve(packageDir, entry))
  files.set(entry, createHash('sha256').update(bytes).digest('hex'))
}
const result = {
  nativeCross: controls(nativeB, nativeA),
  sameCopy: controls(polyA, polyA),
  foreignCopy: controls(polyB, polyA),
  foreignCopyReverse: controls(polyA, polyB),
  duplicateInstallation: controls(copyA, copyB),
  publicEntries: {
    nativePreserved,
    installSharesIndex: globalThis.Temporal === index.Temporal,
    separateStandalone: index.Temporal.Instant !== standalone.Temporal.Instant,
    indexToStandalone: controls({T: index.Temporal}, {T: standalone.Temporal}),
    standaloneToIndex: controls({T: standalone.Temporal}, {T: index.Temporal}),
    sameGraphInstall: controls({T: index.Temporal}, {T: globalThis.Temporal}),
  },
  node: process.versions.node,
  icu: process.versions.icu,
  sharedSymbol:
    vm.runInContext("Symbol.for('formatjs.example')", polyA.context) ===
    vm.runInContext("Symbol.for('formatjs.example')", polyB.context),
  sharedGlobals:
    vm.runInContext('globalThis', polyA.context) ===
    vm.runInContext('globalThis', polyB.context),
  sharedObjectPrototype:
    vm.runInContext('Object.prototype', polyA.context) ===
    vm.runInContext('Object.prototype', polyB.context),
  nativeIntoOwned: controls(nativeB, polyA),
  ownedIntoNative: controls(polyB, nativeA),
  observations,
  traces,
  explicitFormatterRegistration: {beforeRegistration, afterRegistration},
  files: Object.fromEntries(files),
}
console.log(JSON.stringify(result, null, 2))
