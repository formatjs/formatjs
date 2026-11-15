import type {RelativeTo} from '#packages/temporal/relative-duration.js'
import type {
  CalendarId,
  CalendarFields,
  CalendarDate,
  DateDuration,
  Overflow,
} from '#packages/temporal/calendar.js'
import type {ISODateTime, Disambiguation} from '#packages/temporal/kernel.js'
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
  transformDuration(fields: DurationFields, absolute: boolean): DurationFields
  parseDuration(value: string): DurationFields
  validateDuration(fields: DurationFields): void
  formatDuration(
    fields: DurationFields,
    precision: number | 'auto',
    mode: RoundingMode
  ): string
  addDuration(
    one: DurationFields,
    two: DurationFields,
    subtract: boolean
  ): DurationFields
  compareDuration(
    one: DurationFields,
    two: DurationFields,
    relative?: RelativeTo
  ): -1 | 0 | 1
  totalDuration(
    fields: DurationFields,
    unit: string,
    relative?: RelativeTo
  ): number
  roundDuration(
    fields: DurationFields,
    largest: string,
    smallest: string,
    increment: number,
    mode: RoundingMode,
    relative?: RelativeTo
  ): DurationFields
  timeZoneIdentity(identifier: string): {identifier: string; primary: string}
  timeZoneOffset(identifier: string, value: bigint): bigint
  timeZonePossibleInstants(identifier: string, fields: ISODateTime): bigint[]
  timeZoneResolve(
    identifier: string,
    fields: ISODateTime,
    disambiguation: Disambiguation
  ): bigint
  timeZoneTransition(
    identifier: string,
    value: bigint,
    direction: 'next' | 'previous'
  ): bigint | null
  calendarStartOfYear(calendar: CalendarId, year: number): number
  calendarMonthsInYear(calendar: CalendarId, year: number): number
  calendarDaysInMonth(calendar: CalendarId, year: number, month: number): number
  calendarToEpochDay(
    calendar: CalendarId,
    fields: CalendarFields,
    overflow: Overflow
  ): number
  calendarFromEpochDay(calendar: CalendarId, epoch: number): CalendarDate
  calendarAdd(
    calendar: CalendarId,
    fields: CalendarFields,
    duration: DateDuration,
    overflow: Overflow
  ): CalendarDate
  calendarUntil(
    calendar: CalendarId,
    one: number,
    two: number,
    largest: string
  ): DateDuration
  calendarMonthSerial(calendar: CalendarId, year: number, month: number): number
  calendarEra(
    calendar: CalendarId,
    epoch: number
  ): {era: string; eraYear: number} | undefined
  calendarYearFromEra(calendar: CalendarId, era: string, year: number): number
  isoToEpochNanoseconds(fields: ISODateTime): bigint
  epochNanosecondsToISO(value: bigint): Required<ISODateTime>
  addISODays(fields: ISODateTime, days: number): Required<ISODateTime>
  parsePlainTime(value: string): bigint
  regulatePlainTime(values: number[], constrain: boolean): bigint
  formatPlainTime(
    value: bigint,
    precision: Precision,
    mode: RoundingMode
  ): string
  addPlainTime(
    value: bigint,
    duration: DurationFields,
    subtract: boolean
  ): bigint
  roundPlainTime(
    value: bigint,
    unit: TimeUnit,
    increment: number,
    mode: RoundingMode
  ): bigint
  differencePlainTime(
    value: bigint,
    other: bigint,
    largest: TimeUnit,
    smallest: TimeUnit,
    increment: number,
    mode: RoundingMode
  ): DurationFields
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
    if (
      (op === 'parseInstant' ||
        op === 'parsePlainTime' ||
        op === 'parseDuration') &&
      apply(indexOf, source, ['\\u']) >= 0
    )
      throw new BadRange('Invalid Temporal string')
    const result = query(source)
    if (typeof result === 'number')
      throw new BadRange('Invalid Temporal value or range')
    return parse(result)
  }
  function isoFields(fields: ISODateTime): Record<string, number> {
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
    return copy
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
      record.fields = isoFields(fields)
    }
    if (value !== undefined) record.nanoseconds = apply(bigintText, value, [])
    if (days !== undefined) record.days = days
    return call(op, record)
  }
  function addition(
    op: string,
    value: bigint,
    fields: DurationFields,
    subtract: boolean
  ): bigint {
    return ToBigInt(
      call(op, {
        nanoseconds: text(value),
        duration: durationFields(fields),
        subtract,
      })
    )
  }
  function durationFields(fields: DurationFields): Record<string, string> {
    const duration = create(null)
    const names = keys(fields)
    for (let index = 0; index < names.length; index++)
      duration[names[index]] = text(
        ToBigInt(fields[names[index] as keyof DurationFields])
      )
    return duration
  }
  function dateFields(value: CalendarFields): Record<string, unknown> {
    const fields = create(null)
    fields.year = value.year
    if (value.month !== undefined) fields.month = value.month
    if (value.monthCode !== undefined) fields.monthCode = value.monthCode
    fields.day = value.day
    return fields
  }
  function relativeFields(
    relative?: RelativeTo
  ): Record<string, unknown> | undefined {
    if (!relative) return undefined
    const result = create(null)
    if ('date' in relative) {
      result.kind = 'date'
      result.epochDay = relative.date.epochDay
      result.calendar = relative.date.calendar
    } else {
      result.kind = 'zoned'
      result.nanoseconds = text(relative.zoned.epochNanoseconds)
      result.calendar = relative.zoned.calendar
      result.identifier = relative.zoned.timeZone
    }
    return result
  }
  native = {
    transformDuration: (fields, absolute) =>
      call('transformDuration', {duration: durationFields(fields), absolute}),
    parseDuration: value => call('parseDuration', {text: value}),
    validateDuration: fields => {
      call('validateDuration', {duration: durationFields(fields)})
    },
    formatDuration: (fields, precision, mode) =>
      call('formatDuration', {
        duration: durationFields(fields),
        precision,
        mode,
      }),
    addDuration: (one, two, subtract) =>
      call('addDuration', {
        duration: durationFields(one),
        other: durationFields(two),
        subtract,
      }),
    compareDuration: (one, two, relative) =>
      call('compareDuration', {
        duration: durationFields(one),
        other: durationFields(two),
        relative: relativeFields(relative),
      }),
    totalDuration: (fields, unit, relative) =>
      call('totalDuration', {
        duration: durationFields(fields),
        unit,
        relative: relativeFields(relative),
      }),
    roundDuration: (fields, largest, smallest, increment, mode, relative) =>
      call('roundDuration', {
        duration: durationFields(fields),
        largest,
        smallest,
        increment,
        mode,
        relative: relativeFields(relative),
      }),
    timeZoneIdentity: identifier => call('timeZoneIdentity', {identifier}),
    timeZoneOffset: (identifier, value) =>
      ToBigInt(call('timeZoneOffset', {identifier, nanoseconds: text(value)})),
    timeZonePossibleInstants: (identifier, fields) => {
      const values = call('timeZonePossibleInstants', {
        identifier,
        fields: isoFields(fields),
      })
      const result: bigint[] = []
      for (let index = 0; index < values.length; index++)
        result.push(ToBigInt(values[index]))
      return result
    },
    timeZoneResolve: (identifier, fields, disambiguation) =>
      ToBigInt(
        call('timeZoneResolve', {
          identifier,
          fields: isoFields(fields),
          disambiguation,
        })
      ),
    timeZoneTransition: (identifier, value, direction) => {
      const result = call('timeZoneTransition', {
        identifier,
        nanoseconds: text(value),
        direction,
      })
      return result === null ? null : ToBigInt(result)
    },
    calendarStartOfYear: (calendar, year) =>
      call('calendarStartOfYear', {calendar, year}),
    calendarMonthsInYear: (calendar, year) =>
      call('calendarMonthsInYear', {calendar, year}),
    calendarDaysInMonth: (calendar, year, month) =>
      call('calendarDaysInMonth', {calendar, year, month}),
    calendarToEpochDay: (calendar, fields, overflow) =>
      call('calendarToEpochDay', {
        calendar,
        fields: dateFields(fields),
        overflow,
      }),
    calendarFromEpochDay: (calendar, epoch) =>
      call('calendarFromEpochDay', {calendar, epoch}),
    calendarAdd: (calendar, fields, values, overflow) => {
      const duration = create(null)
      duration.years = values.years ?? 0
      duration.months = values.months ?? 0
      duration.weeks = values.weeks ?? 0
      duration.days = values.days ?? 0
      return call('calendarAdd', {
        calendar,
        fields: dateFields(fields),
        duration,
        overflow,
      })
    },
    calendarUntil: (calendar, one, two, largest) =>
      call('calendarUntil', {calendar, one, two, largest}),
    calendarMonthSerial: (calendar, year, month) =>
      call('calendarMonthSerial', {calendar, year, month}),
    calendarEra: (calendar, epoch) =>
      call('calendarEra', {calendar, epoch}) ?? undefined,
    calendarYearFromEra: (calendar, era, year) =>
      call('calendarYearFromEra', {calendar, era, year}),
    isoToEpochNanoseconds: fields =>
      ToBigInt(request('isoToEpochNanoseconds', fields)),
    epochNanosecondsToISO: value =>
      request('epochNanosecondsToISO', undefined, value),
    addISODays: (fields, days) =>
      request('addISODays', fields, undefined, days),
    parsePlainTime: value => ToBigInt(call('parsePlainTime', {text: value})),
    regulatePlainTime: (values, constrain) => {
      const fields = create(null)
      fields.hour = values[0]
      fields.minute = values[1]
      fields.second = values[2]
      fields.millisecond = values[3]
      fields.microsecond = values[4]
      fields.nanosecond = values[5]
      return ToBigInt(call('regulatePlainTime', {fields, constrain}))
    },
    formatPlainTime: (value, precision, mode) =>
      call('formatPlainTime', {nanoseconds: text(value), precision, mode}),
    addPlainTime: (value, fields, subtract) =>
      addition('addPlainTime', value, fields, subtract),
    roundPlainTime: (value, unit, increment, mode) =>
      ToBigInt(
        call('roundPlainTime', {
          nanoseconds: text(value),
          unit,
          increment,
          mode,
        })
      ),
    differencePlainTime: (value, other, largest, smallest, increment, mode) =>
      call('differencePlainTime', {
        nanoseconds: text(value),
        other: text(other),
        largest,
        smallest,
        increment,
        mode,
      }),
    parseInstant: value => ToBigInt(call('parseInstant', {text: value})),
    formatInstant: (value, precision, offset) =>
      call('formatInstant', {
        nanoseconds: text(value),
        precision,
        offset: offset === undefined ? undefined : text(offset),
      }),
    addInstant: (value, fields, subtract) =>
      addition('addInstant', value, fields, subtract),
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
