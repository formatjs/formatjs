import {ToDurationRecord} from '#packages/ecma402-abstract/DurationFormat/ToDurationRecord.js'
import type {
  DurationInput,
  DurationRecord,
} from '#packages/ecma402-abstract/types/duration.js'

export interface TemporalDurationNamespace {
  Duration: {prototype: object; from(value: string): object}
}
const fields = [
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
] as const
const apply = Reflect.apply
const readers: {
  constructor: TemporalDurationNamespace['Duration']
  from: TemporalDurationNamespace['Duration']['from']
  getters: ((this: unknown) => number)[]
}[] = []

export function registerTemporalDurationNamespace(
  namespace: TemporalDurationNamespace
): void {
  const constructor = namespace?.Duration
  if (
    !constructor ||
    readers.some(reader => reader.constructor === constructor)
  )
    return
  const from = constructor.from,
    prototype = constructor.prototype
  if (
    typeof from !== 'function' ||
    prototype === null ||
    (typeof prototype !== 'object' && typeof prototype !== 'function')
  )
    return
  const getters = fields.map(
    field => Object.getOwnPropertyDescriptor(prototype, field)?.get
  )
  if (getters.some(getter => typeof getter !== 'function')) return
  readers.push({
    constructor,
    from,
    getters: getters as ((this: unknown) => number)[],
  })
}
const temporal = (
  globalThis as typeof globalThis & {Temporal?: TemporalDurationNamespace}
).Temporal
if (temporal) registerTemporalDurationNamespace(temporal)

// https://tc39.es/proposal-temporal/#sec-Intl.DurationFormat.prototype.format
export function ToTemporalDurationRecord(
  input: DurationInput | string
): DurationRecord {
  if (typeof input === 'string' && readers.length) {
    const reader = readers[readers.length - 1]
    input = apply(reader.from, reader.constructor, [input]) as DurationInput
  }
  if (
    input !== null &&
    (typeof input === 'object' || typeof input === 'function')
  ) {
    for (const reader of readers) {
      let years: number
      try {
        years = apply(reader.getters[0], input, [])
      } catch {
        continue
      }
      const record = Object.create(null) as DurationRecord
      record.years = years
      for (let index = 1; index < fields.length; index++)
        record[fields[index]] = apply(reader.getters[index], input, [])
      return record
    }
  }
  return ToDurationRecord(input as DurationInput)
}
