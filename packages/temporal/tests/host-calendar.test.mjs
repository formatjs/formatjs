import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

const {Temporal} = await import(
  pathToFileURL(runfiles.resolve(process.argv[2]))
)

// First offset lookup uses the host formatter for this named zone.
{
  const zoned = new Temporal.ZonedDateTime(0n, 'Asia/Kathmandu')
  const parts = Intl.DateTimeFormat.prototype.formatToParts
  const call = Object.getOwnPropertyDescriptor(Function.prototype, 'call')
  const apply = Reflect.apply
  let actual
  try {
    Object.defineProperty(Function.prototype, 'call', {
      ...call,
      value(...args) {
        if (this === parts) throw new Error('Observable host offset call')
        return apply(call.value, this, args)
      },
    })
    actual = zoned.offsetNanoseconds
  } finally {
    Object.defineProperty(Function.prototype, 'call', call)
  }
  assert.equal(actual, 19_800_000_000_000)
}

// Hong Kong Observatory: 2023 leap second month; 2024 lunar new year.
for (const calendar of ['chinese', 'dangi']) {
  const leap = Temporal.PlainDate.from('2023-03-22').withCalendar(calendar)
  assert.deepEqual(
    [leap.year, leap.month, leap.monthCode, leap.day],
    [2023, 3, 'M02L', 1]
  )
  assert.equal(leap.daysInMonth, 29)
  assert.equal(leap.monthsInYear, 13)
  assert.equal(leap.add({months: -1}).toString().slice(0, 10), '2023-02-20')
  assert.equal(leap.add({months: 1}).toString().slice(0, 10), '2023-04-20')
  assert.equal(leap.add({years: 1}).monthCode, 'M02')
  assert.throws(() => leap.add({years: 1}, {overflow: 'reject'}), RangeError)
  const next = Temporal.PlainDate.from('2024-02-10').withCalendar(calendar)
  assert.deepEqual([next.year, next.monthCode, next.day], [2024, 'M01', 1])
  assert.equal(leap.until(next, {largestUnit: 'month'}).months, 11)
  assert.equal(next.until(leap, {largestUnit: 'month'}).months, -11)
  assert.equal(
    leap.add({months: 24}).subtract({months: 24}).toString(),
    leap.toString()
  )
}

const originalParts = Intl.DateTimeFormat.prototype.formatToParts
const originalResolved = Intl.DateTimeFormat.prototype.resolvedOptions
try {
  Intl.DateTimeFormat.prototype.formatToParts = () => {
    throw new Error('poisoned Intl')
  }
  Intl.DateTimeFormat.prototype.resolvedOptions = () => {
    throw new Error('poisoned Intl')
  }
  assert.equal(
    Temporal.PlainDate.from('2025-03-01').withCalendar('islamic-umalqura').day,
    1
  )
} finally {
  Intl.DateTimeFormat.prototype.formatToParts = originalParts
  Intl.DateTimeFormat.prototype.resolvedOptions = originalResolved
}
const ummAlQura =
  Temporal.PlainDate.from('2024-03-11').withCalendar('islamic-umalqura')
assert.deepEqual([ummAlQura.year, ummAlQura.month, ummAlQura.day], [1445, 9, 1])
assert.equal(ummAlQura.daysInMonth, 30)
for (const year of [1200, 1700]) {
  const input = {year, month: 3, day: 11}
  assert.equal(
    Temporal.PlainDate.from({...input, calendar: 'islamic-umalqura'})
      .toString()
      .slice(0, 10),
    Temporal.PlainDate.from({...input, calendar: 'islamic-civil'})
      .toString()
      .slice(0, 10)
  )
}

console.log(
  'Host calendar conversion, leap arithmetic, civil fallback and captured intrinsics pass'
)

async function checkPrivateHostAddition(bundle, hook) {
  const assert = (await import('node:assert/strict')).default
  const {Temporal} = await import(bundle)
  const apply = Reflect.apply
  const define = Object.defineProperty
  const originalCall = Function.prototype.call
  const parts = Intl.DateTimeFormat.prototype.formatToParts
  const resolved = Intl.DateTimeFormat.prototype.resolvedOptions
  const iteratorPrototype = Object.getPrototypeOf(new Map().keys())
  const targets = {
    map: [Array.prototype, 'map'],
    species: [Array, Symbol.species],
    iterator: [Array.prototype, Symbol.iterator],
    push: [Array.prototype, 'push'],
    reverse: [Array.prototype, 'reverse'],
    slice: [Array.prototype, 'slice'],
    get: [Map.prototype, 'get'],
    set: [Map.prototype, 'set'],
    size: [Map.prototype, 'size'],
    delete: [Map.prototype, 'delete'],
    keys: [Map.prototype, 'keys'],
    next: [iteratorPrototype, 'next'],
    call: [Function.prototype, 'call'],
    option: [Object.prototype, 'weekday'],
    index: [Array.prototype, '0'],
  }
  const [target, key] = targets[hook]
  const original = Object.getOwnPropertyDescriptor(target, key)
  const eviction = ['size', 'delete', 'keys', 'next'].includes(hook)
  if (eviction) {
    for (let year = 1900; year < 2040; year++)
      Temporal.PlainDate.from(`${year}-07-01`)
        .withCalendar('chinese')
        .add({days: 1})
  }
  const cases = eviction
    ? [['chinese', '2050-07-01', {days: 1}, '2050-07-02']]
    : [
        ['chinese', '2023-03-22', {months: 1}, '2023-04-20'],
        ['dangi', '2023-03-22', {months: 1}, '2023-04-20'],
        ['islamic-umalqura', '2024-03-11', {months: 1}, '2024-04-10'],
        ['chinese', '1898-07-01', {days: 1}, '1898-07-02'],
        ['dangi', '1898-07-01', {days: 1}, '1898-07-02'],
        ['chinese', '2023-03-22', {months: 1}, '2023-04-20'],
        ['chinese', '2024-02-10', {months: 1}, '2024-03-10'],
        ['islamic-umalqura', '2024-03-11', {months: 1}, '2024-04-10'],
      ]
  const failures = []
  for (const [calendar, iso, fields, expected] of cases) {
    const date = Temporal.PlainDate.from(iso).withCalendar(calendar)
    const duration = Temporal.Duration.from(fields)
    let reads = 0
    const options = {
      get overflow() {
        reads++
        return 'constrain'
      },
    }
    let calls = 0,
      result,
      error
    const fail = () => {
      calls++
      throw new Error('Observable private host calendar operation')
    }
    const getter = ['species', 'size', 'option', 'index'].includes(hook)
    try {
      define(target, key, {
        configurable: true,
        ...(getter
          ? {get: fail, ...(hook === 'index' ? {set: fail} : {})}
          : {
              writable: true,
              value:
                hook === 'call'
                  ? function (...args) {
                      if (this === parts || this === resolved) return fail()
                      return apply(originalCall, this, args)
                    }
                  : fail,
            }),
      })
      result = date.add(duration, options)
    } catch (caught) {
      error = caught
    } finally {
      if (original) define(target, key, original)
      else delete target[key]
    }
    if (error || calls) failures.push(`${hook}/${calendar}/${iso}: ${error}`)
    else {
      assert.equal(result.toString(), `${expected}[u-ca=${calendar}]`)
      assert.equal(reads, 1, 'Public overflow getter still runs once')
    }
  }
  assert.deepEqual(
    failures,
    [],
    'Host addition keeps private operations private'
  )
}

const {spawnSync} = await import('node:child_process')
const hookFailures = []
for (const hook of [
  'map',
  'species',
  'iterator',
  'push',
  'reverse',
  'slice',
  'get',
  'set',
  'size',
  'delete',
  'keys',
  'next',
  'call',
  'option',
  'index',
]) {
  const child = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `await (${checkPrivateHostAddition.toString()})(process.argv[1], process.argv[2])`,
      pathToFileURL(runfiles.resolve(process.argv[2])).href,
      hook,
    ],
    {encoding: 'utf8'}
  )
  if (child.status !== 0) hookFailures.push(`${hook}: ${child.stderr}`)
}
assert.deepEqual(hookFailures, [], 'Fresh-process host calendar controls')
