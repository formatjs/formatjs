// Package tests stay runtime-independent; unsupported assertions fail loudly.
type Callback = () => unknown
type Register = (name: string, body: Callback) => void
type Each = (
  rows: readonly unknown[]
) => (pattern: string, body: (...args: any[]) => unknown) => void
type TestRegistration = Register & {
  skip: Register
  each: Each
  skipIf(condition: boolean): Register
}
type SuiteRegistration = Register & {each: Each}
type Expect = {
  (actual: any): any
  objectContaining(value: any): {__objectContaining: boolean; value: any}
  assertions(count: number): void
  any(type: any): any
  arrayContaining(value: any[]): any
}
type Suite = {
  name: string
  parent?: Suite
  entries: (Suite | Case)[]
  before: Callback[]
  after: Callback[]
}
type Case = {name: string; body?: Callback}
let root: Suite,
  current: Suite,
  active = '',
  ordinal = 0
let passed = 0,
  skipped = 0,
  assertions = 0,
  snapshots = 0
let plannedAssertions: number | undefined
const failures: string[] = []
let expected = (globalThis as any).__PACKAGE_SNAPSHOTS || {}
let exclusions = (globalThis as any).__PACKAGE_EXCLUSIONS || {}
const used: Record<string, boolean> = {}
export function beginFile(name: string): void {
  passed = skipped = assertions = snapshots = 0
  failures.length = 0
  for (const key of Object.keys(used)) delete used[key]
  expected = (globalThis as any).__PACKAGE_SNAPSHOTS || {}
  exclusions = (globalThis as any).__PACKAGE_EXCLUSIONS || {}
  root = current = {name, entries: [], before: [], after: []}
}
function title(suite: Suite): string[] {
  return suite.parent ? [...title(suite.parent), suite.name] : []
}
export const describe: SuiteRegistration = Object.assign(
  (name: string, body: Callback): void => {
    const parent = current
    const suite: Suite = {name, parent, entries: [], before: [], after: []}
    parent.entries.push(suite)
    current = suite
    try {
      body()
    } finally {
      current = parent
    }
  },
  {each: (rows: readonly unknown[]) => each(describe)(rows)}
)
function display(value: unknown): string {
  if (
    (typeof value === 'object' && value !== null) ||
    typeof value === 'function'
  )
    return '[object]'
  if (typeof value === 'symbol') return Symbol.prototype.toString.call(value)
  return String(value)
}
function label(pattern: string, values: unknown[], index: number): string {
  let next = 0
  return pattern.replace(/%[sidojf#%]/g, token =>
    token === '%%'
      ? '%'
      : token === '%#'
        ? String(index)
        : display(values[next++])
  )
}
function each(register: Register): Each {
  return (rows: readonly unknown[]) =>
    (pattern: string, body: (...args: any[]) => unknown) => {
      rows.forEach((row, index) => {
        const values = Array.isArray(row) ? row : [row]
        register(label(pattern, values, index), () => body(...values))
      })
    }
}
export const it: TestRegistration = Object.assign(
  (name: string, body: Callback): void => {
    current.entries.push({name, body})
  },
  {
    skipIf: (condition: boolean): Register => (condition ? it.skip : it),
    skip: (name: string, _body: Callback): void => {
      current.entries.push({name})
    },
    each: (rows: readonly unknown[]) => each(it)(rows),
  }
)
export const test: TestRegistration = it
export function beforeAll(body: Callback): void {
  current.before.push(body)
}
export function afterEach(body: Callback): void {
  current.after.push(body)
}
export function finishFile(): void {
  function run(suite: Suite, after: Callback[]) {
    for (const hook of suite.before) hook()
    for (const entry of suite.entries) {
      if ('entries' in entry) {
        run(entry, [...suite.after, ...after])
        continue
      }
      const name = [...title(suite), entry.name].join(' > ')
      const exclusion = exclusions[name]
      if (!entry.body || exclusion) {
        if (exclusion) used[name] = true
        skipped++
        continue
      }
      active = name
      ordinal = 0
      plannedAssertions = undefined
      const beforeAssertions = assertions
      try {
        const result = entry.body()
        if (result && typeof (result as any).then === 'function')
          throw Error('Async package test requires explicit runner support')
        if (
          plannedAssertions !== undefined &&
          assertions - beforeAssertions !== plannedAssertions
        )
          throw Error(
            `Expected ${plannedAssertions} assertions, got ${assertions - beforeAssertions}`
          )
        passed++
      } catch (error) {
        failures.push(name + ': ' + String(error))
      } finally {
        for (const hook of [...suite.after, ...after]) hook()
      }
    }
  }
  run(root, [])
}
function equal(
  actual: any,
  wanted: any,
  partial = false,
  strict = false
): boolean {
  if (!strict && wanted && wanted.__any) {
    const type = wanted.type
    return type === Array
      ? Array.isArray(actual)
      : type === String
        ? typeof actual === 'string'
        : type === Number
          ? typeof actual === 'number'
          : type === Boolean
            ? typeof actual === 'boolean'
            : actual instanceof type
  }
  if (!strict && wanted && wanted.__arrayContaining)
    return (
      Array.isArray(actual) &&
      wanted.value.every((item: any) =>
        actual.some((value: any) => equal(value, item))
      )
    )
  if (!strict && wanted && wanted.__objectContaining)
    return equal(actual, wanted.value, true)
  if (Object.is(actual, wanted)) return true
  if (Array.isArray(actual) !== Array.isArray(wanted)) return false
  if (
    actual === null ||
    wanted === null ||
    typeof actual !== 'object' ||
    typeof wanted !== 'object'
  )
    return false
  if (actual instanceof Date || wanted instanceof Date)
    return (
      actual instanceof Date &&
      wanted instanceof Date &&
      Object.is(+actual, +wanted)
    )
  const keys = Object.keys(wanted).filter(
    key => strict || wanted[key] !== undefined
  )
  return (
    (partial ||
      Object.keys(actual).filter(key => strict || actual[key] !== undefined)
        .length === keys.length) &&
    keys.every(
      key =>
        Object.prototype.hasOwnProperty.call(actual, key) &&
        equal(actual[key], wanted[key], partial, strict)
    )
  )
}
export const expect: Expect = Object.assign(
  (actual: any): any => {
    function match(negated: boolean): any {
      function check(ok: boolean, message: string) {
        assertions++
        if (ok === negated)
          throw Error(message + '; received ' + String(actual))
      }
      return {
        get not() {
          return match(!negated)
        },
        toBe(value: any) {
          check(Object.is(actual, value), 'Expected ' + String(value))
        },
        toEqual(value: any) {
          check(
            equal(actual, value),
            'Expected deep equality: ' + JSON.stringify(value)
          )
        },
        toMatchObject(value: any) {
          check(equal(actual, value, true), 'Expected matching object')
        },
        toBeUndefined() {
          check(actual === undefined, 'Expected undefined')
        },
        toBeDefined() {
          check(actual !== undefined, 'Expected defined value')
        },
        toBeFalsy() {
          check(!actual, 'Expected falsy value')
        },
        toHaveLength(value: number) {
          check(actual.length === value, 'Expected length ' + value)
        },
        toHaveProperty(key: string, value?: any) {
          const present = actual != null && key in Object(actual)
          check(
            present && (arguments.length < 2 || equal(actual[key], value)),
            'Expected property ' + key
          )
        },
        toBeLessThan(value: number) {
          check(actual < value, 'Expected less than ' + value)
        },
        toBeLessThanOrEqual(value: number) {
          check(actual <= value, 'Expected at most ' + value)
        },
        toBeTruthy() {
          check(!!actual, 'Expected truthy value')
        },
        toBeInstanceOf(value: any) {
          check(actual instanceof value, 'Expected instance of ' + value.name)
        },
        toBeGreaterThan(value: number) {
          check(actual > value, 'Expected greater than ' + value)
        },
        toContain(value: any) {
          check(actual.includes(value), 'Expected containment')
        },
        toContainEqual(value: any) {
          check(
            actual.some((item: any) => equal(item, value)),
            'Expected deep containment'
          )
        },
        toMatch(value: string | RegExp) {
          check(
            typeof value === 'string'
              ? actual.includes(value)
              : value.test(actual),
            'Expected match'
          )
        },
        toThrowError(value?: any) {
          return this.toThrow(value)
        },
        toThrow(value?: any) {
          let caught: any,
            threw = false
          try {
            actual()
          } catch (error) {
            caught = error
            threw = true
          }
          check(
            threw &&
              (value === undefined ||
                (typeof value === 'function'
                  ? caught instanceof value
                  : value instanceof Error
                    ? caught?.message === value.message &&
                      caught?.name === value.name
                    : value instanceof RegExp
                      ? value.test(String(caught.message))
                      : String(caught.message).includes(String(value)))),
            'Expected throw ' + String(value)
          )
        },
        toMatchSnapshot() {
          if (negated) throw Error('Negated snapshots unsupported')
          const key = active + ' ' + ++ordinal
          if (!(key in expected))
            throw Error('Missing existing snapshot: ' + key)
          snapshots++
          used[key] = true
          check(
            equal(actual, expected[key], false, true),
            'Snapshot mismatch ' +
              key +
              '; expected ' +
              JSON.stringify(expected[key])
          )
        },
      }
    }
    return match(false)
  },
  {
    assertions: (count: number): void => {
      plannedAssertions = count
    },
    objectContaining: (value: any) => ({__objectContaining: true, value}),
    any: (type: any) => ({__any: true, type}),
    arrayContaining: (value: any[]) => ({__arrayContaining: true, value}),
  }
)
export function report(): void {
  const stale = Object.keys(exclusions).filter(name => !used[name])
  const unused = Object.keys(expected).filter(key => !used[key])
  if (unused.length)
    failures.push('Unused existing snapshots: ' + unused.join(', '))
  if (stale.length) failures.push('Stale exclusions: ' + stale.join(', '))
  const result = {passed, skipped, assertions, snapshots, failures, exclusions}
  ;(globalThis as any).print(JSON.stringify(result))
  if (failures.length)
    throw Error(failures.length + ' package conformance failures')
}
