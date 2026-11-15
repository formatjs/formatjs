import type {ISODateTime} from '#packages/temporal/kernel.js'

export type NativeISOQuery = (request: string) => string | number
const parse = JSON.parse
const stringify = JSON.stringify
const create = Object.create
const apply = Reflect.apply
const bigintText = BigInt.prototype.toString
const ToBigInt = BigInt
const BadRange = RangeError
export interface NativeISO {
  isoToEpochNanoseconds(fields: ISODateTime): bigint
  epochNanosecondsToISO(value: bigint): Required<ISODateTime>
  addISODays(fields: ISODateTime, days: number): Required<ISODateTime>
}
let native: NativeISO | undefined
export function nativeISO(): NativeISO | undefined {
  return native
}
/** @internal Experimental Hermes backend installation. */
export function configureNativeISO(query: NativeISOQuery): void {
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
    const result = query(stringify(record))
    if (typeof result === 'number')
      throw new BadRange('Invalid Temporal ISO fields or range')
    return parse(result)
  }
  native = {
    isoToEpochNanoseconds: fields =>
      ToBigInt(request('isoToEpochNanoseconds', fields)),
    epochNanosecondsToISO: value =>
      request('epochNanosecondsToISO', undefined, value),
    addISODays: (fields, days) =>
      request('addISODays', fields, undefined, days),
  }
}
