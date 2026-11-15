import type {ISODateTime} from '#packages/temporal/kernel.js'
import type {
  Precision,
  RoundingMode,
  TimeUnit,
} from '#packages/temporal/rounding.js'
import type {DurationFields} from '#packages/temporal/duration-core.js'

export type NativeQuery = (request: string) => string | number
const parse = JSON.parse
const stringify = JSON.stringify
const create = Object.create
const keys = Object.keys
const indexOf = String.prototype.indexOf
const apply = Reflect.apply
const bigintText = BigInt.prototype.toString
const ToBigInt = BigInt
const BadRange = RangeError
export interface NativeTemporal {
  isoToEpochNanoseconds(fields: ISODateTime): bigint
  epochNanosecondsToISO(value: bigint): Required<ISODateTime>
  addISODays(fields: ISODateTime, days: number): Required<ISODateTime>
  parseInstant(value: string): bigint
  formatInstant(value: bigint, precision: Precision, offset?: bigint): string
  addInstant(value: bigint, duration: DurationFields, subtract: boolean): bigint
  roundInstant(value: bigint, quantum: bigint, mode: RoundingMode): bigint
  differenceInstant(
    value: bigint,
    other: bigint,
    largest: TimeUnit,
    smallest: TimeUnit,
    increment: number,
    mode: RoundingMode
  ): DurationFields
}
let native: NativeTemporal | undefined
export function nativeTemporal(): NativeTemporal | undefined {
  return native
}
/** @internal Experimental Hermes backend installation. */
export function configureNativeTemporal(query: NativeQuery): void {
  const text = (value: bigint) => apply(bigintText, value, [])
  function call(op: string, properties: Record<string, unknown>): any {
    const input = create(null)
    input.op = op
    const names = keys(properties)
    for (let index = 0; index < names.length; index++)
      input[names[index]] = properties[names[index]]
    const source = stringify(input)
    // Escaped code units violate Temporal's ASCII grammar; reject before UTF-8 decoding.
    if (op === 'parseInstant' && apply(indexOf, source, ['\\u']) >= 0)
      throw new BadRange('Invalid instant string')
    const result = query(source)
    if (typeof result === 'number')
      throw new BadRange('Invalid Temporal value or range')
    return parse(result)
  }
  function request(
    op: string,
    fields?: ISODateTime,
    value?: bigint,
    days?: number
  ): any {
    const record = create(null)
    record.op = op
    if (fields) {
      const copy = create(null)
      copy.year = fields.year
      copy.month = fields.month
      copy.day = fields.day
      copy.hour = fields.hour ?? 0
      copy.minute = fields.minute ?? 0
      copy.second = fields.second ?? 0
      copy.millisecond = fields.millisecond ?? 0
      copy.microsecond = fields.microsecond ?? 0
      copy.nanosecond = fields.nanosecond ?? 0
      record.fields = copy
    }
    if (value !== undefined) record.nanoseconds = apply(bigintText, value, [])
    if (days !== undefined) record.days = days
    return call(op, record)
  }
  native = {
    isoToEpochNanoseconds: fields =>
      ToBigInt(request('isoToEpochNanoseconds', fields)),
    epochNanosecondsToISO: value =>
      request('epochNanosecondsToISO', undefined, value),
    addISODays: (fields, days) =>
      request('addISODays', fields, undefined, days),
    parseInstant: value => ToBigInt(call('parseInstant', {text: value})),
    formatInstant: (value, precision, offset) =>
      call('formatInstant', {
        nanoseconds: text(value),
        precision,
        offset: offset === undefined ? undefined : text(offset),
      }),
    addInstant: (value, fields, subtract) => {
      const duration = create(null)
      const names = keys(fields)
      for (let index = 0; index < names.length; index++)
        duration[names[index]] = text(
          ToBigInt(fields[names[index] as keyof DurationFields])
        )
      return ToBigInt(
        call('addInstant', {nanoseconds: text(value), duration, subtract})
      )
    },
    roundInstant: (value, quantum, mode) =>
      ToBigInt(
        call('roundInstant', {
          nanoseconds: text(value),
          quantum: text(quantum),
          mode,
        })
      ),
    differenceInstant: (value, other, largest, smallest, increment, mode) =>
      call('differenceInstant', {
        nanoseconds: text(value),
        other: text(other),
        largest,
        smallest,
        increment,
        mode,
      }),
  }
}
