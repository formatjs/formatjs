import type {
  DateSlot,
  DateTimeSlot,
  ZonedSlot,
} from '#packages/temporal/plain-slots.js'
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

export interface NativeTimeResult {
  // Clock values are below 2**47; Number is exact.
  nanoseconds: number
  fields: number[]
  bigintNanoseconds?: bigint
}
export interface NativeCall {
  (operation: string, properties: Record<string, unknown>): any
  parseDate?(
    value: string,
    operation: 'parsePlainDate' | 'parsePlainYearMonth' | 'parsePlainMonthDay'
  ): DateSlot
  withISODate?(
    operation: 'withPlainDate' | 'withPlainYearMonth' | 'withPlainMonthDay',
    slot: DateSlot,
    fields: Record<string, unknown>,
    overflow: Overflow
  ): DateSlot
  formatDate?(
    operation:
      | 'formatPlainDate'
      | 'formatPlainYearMonth'
      | 'formatPlainMonthDay',
    slot: DateSlot,
    calendarName: string
  ): string
  addPlainDateTime?: NativeTemporal['addPlainDateTime']
  roundPlainDateTime?: NativeTemporal['roundPlainDateTime']
  parsePlainTimeResult?: NativeTemporal['parsePlainTimeResult']
  regulatePlainTimeResult?: NativeTemporal['regulatePlainTimeResult']
  addPlainTimeResult?: NativeTemporal['addPlainTimeResult']
  roundPlainTimeResult?: NativeTemporal['roundPlainTimeResult']
  formatPlainTime?: NativeTemporal['formatPlainTime']
  differencePlainTime?: NativeTemporal['differencePlainTime']
  formatDuration?: NativeTemporal['formatDuration']
  parsePlainDateTime?: NativeTemporal['parsePlainDateTime']
  formatPlainDateTime?: NativeTemporal['formatPlainDateTime']
  createISODate?: NativeTemporal['createISODate']
  parseInstant?: NativeTemporal['parseInstant']
  formatInstant?: NativeTemporal['formatInstant']
  addInstant?: NativeTemporal['addInstant']
  addPlainDate?: NativeTemporal['addPlainDate']
  roundInstantUnit?: NativeTemporal['roundInstantUnit']
  timeZoneTransition?: NativeTemporal['timeZoneTransition']
  resolveZonedDateTime?: NativeTemporal['resolveZonedDateTime']
  parseZonedFields?: NativeTemporal['parseZonedFields']
  roundZonedDateTime?: NativeTemporal['roundZonedDateTime']
  addZonedDateTime?: NativeTemporal['addZonedDateTime']
  startOfZonedDay?: NativeTemporal['startOfZonedDay']
}
export type NativeQuery = (request: string) => string | number
const parse = JSON.parse
const stringify = JSON.stringify
const create = Object.create
const keys = Object.keys
const indexOf = String.prototype.indexOf
const apply = Reflect.apply
const bigintText = BigInt.prototype.toString
const ToBigInt = BigInt
const ToNumber = Number
const numberText = /* @__PURE__ */ (() => Number.prototype.toString)()
const BadRange = RangeError
const BadType = TypeError
export interface NativeDateSnapshot {
  date: CalendarDate | null
  values: Record<string, string | number | boolean | bigint | undefined>
  errors: string[]
  owner?: NativeTemporal
}
export interface NativeTemporal {
  parsePlainTimeResult(value: string): NativeTimeResult
  regulatePlainTimeResult(
    values: number[],
    constrain: boolean
  ): NativeTimeResult
  addPlainTimeResult(
    value: bigint | number,
    fields: DurationFields,
    subtract: boolean
  ): NativeTimeResult
  roundPlainTimeResult(
    value: bigint | number,
    unit: TimeUnit,
    increment: number,
    mode: RoundingMode
  ): NativeTimeResult

  createISODate(fields: Record<string, unknown>, overflow: Overflow): DateSlot
  withDate(
    slot: DateSlot,
    fields: Record<string, unknown>,
    overflow: Overflow,
    shape?: 'date' | 'year-month' | 'month-day'
  ): DateSlot
  withDateTime(
    slot: DateTimeSlot,
    fields: Record<string, unknown>,
    overflow: Overflow
  ): DateTimeSlot
  withZoned(
    slot: ZonedSlot,
    fields: Record<string, unknown>,
    overflow: Overflow,
    disambiguation: Disambiguation,
    behavior: string
  ): ZonedSlot
  calendarProperties(
    calendar: string,
    epoch: number,
    extended: boolean,
    nanoseconds?: bigint
  ): NativeDateSnapshot
  zonedProperties(slot: ZonedSlot): NativeDateSnapshot
  addPlainYearMonth(
    slot: DateSlot,
    fields: DurationFields,
    subtract: boolean,
    overflow: Overflow
  ): DateSlot
  differencePlainYearMonth(
    start: DateSlot,
    end: DateSlot,
    largest: string,
    smallest: string,
    increment: number,
    mode: RoundingMode,
    since: boolean
  ): DurationFields
  yearMonthToDate(slot: DateSlot, day: number): DateSlot
  monthDayToDate(slot: DateSlot, year: number): DateSlot
  formatPlainDate(slot: DateSlot, calendarName: string): string
  formatPlainDateTime(
    value: bigint,
    calendar: string,
    precision: Precision,
    mode: RoundingMode,
    calendarName: string
  ): string
  formatPlainYearMonth(slot: DateSlot, calendarName: string): string
  formatPlainMonthDay(slot: DateSlot, calendarName: string): string
  formatZonedDateTime(
    slot: ZonedSlot,
    precision: Precision,
    mode: RoundingMode,
    calendarName: string,
    offset: boolean,
    timeZoneName: string
  ): string
  parsePlainDate(value: string): DateSlot
  parsePlainDateTime(value: string): DateTimeSlot
  parsePlainYearMonth(value: string): DateSlot
  parsePlainMonthDay(value: string): DateSlot
  parseZonedFields(value: string): {
    fields: Required<ISODateTime> & {calendar: string}
    timeZone: string
    offset: string | undefined
    localNanoseconds?: bigint
    validatedTimeZone?: string
  }
  resolveZonedDateTime(
    value: bigint,
    identifier: string,
    calendar: string,
    offset: string | undefined,
    behavior: string,
    disambiguation: Disambiguation,
    matchMinute: boolean,
    dateOnly: boolean
  ): ZonedSlot
  addZonedDateTime(
    slot: ZonedSlot,
    fields: DurationFields,
    subtract: boolean,
    overflow: Overflow
  ): ZonedSlot
  differenceZonedDateTime(
    start: ZonedSlot,
    end: ZonedSlot,
    largest: string,
    smallest: string,
    increment: number,
    mode: RoundingMode,
    since: boolean
  ): DurationFields
  roundZonedDateTime(
    slot: ZonedSlot,
    unit: string,
    increment: number,
    mode: RoundingMode
  ): ZonedSlot
  startOfZonedDay(slot: ZonedSlot, day?: number): ZonedSlot
  hoursInZonedDay(slot: ZonedSlot): number
  addPlainDate(
    epochDay: number,
    calendar: string,
    fields: DurationFields,
    subtract: boolean,
    overflow: Overflow
  ): DateSlot
  addPlainDateTime(
    value: bigint,
    calendar: string,
    fields: DurationFields,
    subtract: boolean,
    overflow: Overflow
  ): DateTimeSlot
  differencePlainDate(
    start: number,
    end: number,
    calendar: string,
    largest: string,
    smallest: string,
    increment: number,
    mode: RoundingMode,
    since: boolean
  ): DurationFields
  differencePlainDateTime(
    start: bigint,
    end: bigint,
    calendar: string,
    largest: string,
    smallest: string,
    increment: number,
    mode: RoundingMode,
    since: boolean
  ): DurationFields
  roundPlainDateTime(
    value: bigint,
    calendar: string,
    unit: string,
    increment: number,
    mode: RoundingMode
  ): DateTimeSlot
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
    value: bigint | number,
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
    value: bigint | number,
    other: bigint | number,
    largest: TimeUnit,
    smallest: TimeUnit,
    increment: number,
    mode: RoundingMode
  ): DurationFields
  parseInstant(value: string): bigint
  formatInstant(
    value: bigint,
    precision: Precision,
    offset?: bigint,
    mode?: RoundingMode,
    identifier?: string
  ): string
  addInstant(value: bigint, duration: DurationFields, subtract: boolean): bigint
  roundInstantUnit(
    value: bigint,
    unit: TimeUnit,
    increment: number,
    mode: RoundingMode
  ): bigint
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
export function configureNativeTemporal(
  query: NativeQuery,
  invoke?: NativeCall
): void {
  const formatDate = invoke?.formatDate
  const addPlainDate = invoke?.addPlainDate
  const parseDate = invoke?.parseDate
  const parseDateTime = invoke?.parsePlainDateTime
  const addDateTime = invoke?.addPlainDateTime
  const roundDateTime = invoke?.roundPlainDateTime
  const formatDateTime = invoke?.formatPlainDateTime
  const text = (value: bigint) => apply(bigintText, value, [])
  const clockText = (value: bigint | number) =>
    typeof value === 'number' ? apply(numberText, value, []) : text(value)
  function call(op: string, properties: Record<string, unknown>): any {
    if (invoke) return invoke(op, properties)
    const input = create(null)
    input.op = op
    const names = keys(properties)
    for (let index = 0; index < names.length; index++)
      input[names[index]] = properties[names[index]]
    const source = stringify(input)
    // Escaped code units violate Temporal's ASCII grammar; reject before UTF-8 decoding.
    if (
      apply(indexOf, op, ['parse']) === 0 &&
      apply(indexOf, source, ['\\u']) >= 0
    )
      throw new BadRange('Invalid Temporal string')
    const result = query(source)
    if (typeof result === 'number')
      throw new BadRange('Invalid Temporal value or range')
    return parse(result)
  }
  function withFields(
    calendar: string,
    fields: Record<string, unknown>,
    shape?: string
  ): Record<string, unknown> {
    if (
      calendar !== 'iso8601' &&
      calendar !== 'chinese' &&
      calendar !== 'dangi' &&
      (fields.era === undefined) !== (fields.eraYear === undefined)
    )
      throw new BadType('era and eraYear required together')
    if (
      shape === 'month-day' &&
      calendar !== 'iso8601' &&
      fields.month !== undefined &&
      fields.monthCode === undefined &&
      fields.year === undefined &&
      fields.eraYear === undefined
    )
      throw new BadType('monthCode or year required')
    return fields
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
  function clockResult(value: any): NativeTimeResult {
    if (typeof value === 'string') {
      const nanoseconds =
        ((ToBigInt(value) % 86400000000000n) + 86400000000000n) %
        86400000000000n
      const fields = request('epochNanosecondsToISO', undefined, nanoseconds)
      return {
        nanoseconds: ToNumber(nanoseconds),
        fields: [
          fields.hour,
          fields.minute,
          fields.second,
          fields.millisecond,
          fields.microsecond,
          fields.nanosecond,
        ],
        bigintNanoseconds: nanoseconds,
      }
    }
    return {
      nanoseconds: ToNumber(value.nanoseconds),
      fields: value.fields,
      bigintNanoseconds: undefined,
    }
  }
  function durationFields(
    fields: DurationFields
  ): DurationFields | Record<string, string> {
    if (invoke) return fields
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
  function shortFields(slot: DateSlot): Record<string, unknown> {
    const result = create(null)
    result.epochDay = slot.epochDay
    result.calendar = slot.calendar
    return result
  }
  function zonedFields(slot: ZonedSlot): Record<string, unknown> {
    const result = create(null)
    result.nanoseconds = text(slot.epochNanoseconds)
    result.calendar = slot.calendar
    result.identifier = slot.timeZone
    return result
  }
  function relativeFields(
    relative?: RelativeTo
  ): Record<string, unknown> | undefined {
    if (!relative) return undefined
    if ('zoned' in relative) {
      const result = zonedFields(relative.zoned)
      result.kind = 'zoned'
      return result
    }
    const result = create(null)
    result.kind = 'date'
    result.epochDay = relative.date.epochDay
    result.calendar = relative.date.calendar
    return result
  }
  function dateResult(value: any, calendar?: string): DateSlot {
    if (typeof value === 'number') return {epochDay: value, calendar: calendar!}
    if (value.properties) value.properties.owner = native
    return value
  }
  function timeResult(value: any, calendar?: string, timeZone?: string): any {
    if (typeof value === 'string')
      return {epochNanoseconds: ToBigInt(value), calendar, timeZone}
    value.epochNanoseconds = ToBigInt(value.epochNanoseconds)
    if (value.properties) value.properties.owner = native
    return value
  }
  native = {
    withDate: (slot, fields, overflow, shape = 'date') =>
      dateResult(
        slot.calendar === 'iso8601' && invoke?.withISODate
          ? invoke.withISODate(
              shape === 'date'
                ? 'withPlainDate'
                : shape === 'year-month'
                  ? 'withPlainYearMonth'
                  : 'withPlainMonthDay',
              slot,
              fields,
              overflow
            )
          : call(
              shape === 'date'
                ? 'withPlainDate'
                : shape === 'year-month'
                  ? 'withPlainYearMonth'
                  : 'withPlainMonthDay',
              {
                value: shortFields(slot),
                fields: withFields(slot.calendar, fields, shape),
                overflow,
              }
            ),
        slot.calendar
      ),
    withDateTime: (slot, fields, overflow) =>
      timeResult(
        call('withPlainDateTime', {
          nanoseconds: text(slot.epochNanoseconds),
          calendar: slot.calendar,
          fields: withFields(slot.calendar, fields),
          overflow,
        }),
        slot.calendar
      ),
    withZoned: (slot, fields, overflow, disambiguation, behavior) =>
      timeResult(
        call('withZonedDateTime', {
          value: zonedFields(slot),
          fields: withFields(slot.calendar, fields),
          overflow,
          disambiguation,
          behavior,
        }),
        slot.calendar,
        slot.timeZone
      ),
    calendarProperties: (calendar, epoch, extended, nanoseconds) =>
      call('calendarProperties', {
        calendar,
        epoch,
        extended,
        nanoseconds: nanoseconds === undefined ? undefined : text(nanoseconds),
      }),
    zonedProperties: slot =>
      call('zonedProperties', {value: zonedFields(slot)}),
    addPlainYearMonth: (slot, fields, subtract, overflow) =>
      dateResult(
        call('addPlainYearMonth', {
          value: shortFields(slot),
          duration: durationFields(fields),
          subtract,
          overflow,
        }),
        slot.calendar
      ),
    differencePlainYearMonth: (
      start,
      end,
      largest,
      smallest,
      increment,
      mode,
      since
    ) =>
      call('differencePlainYearMonth', {
        value: shortFields(start),
        other: shortFields(end),
        largest,
        smallest,
        increment,
        mode,
        since,
      }),
    yearMonthToDate: (slot, day) =>
      dateResult(
        call('yearMonthToDate', {value: shortFields(slot), day}),
        slot.calendar
      ),
    monthDayToDate: (slot, year) =>
      dateResult(
        call('monthDayToDate', {value: shortFields(slot), year}),
        slot.calendar
      ),
    formatPlainDate: (slot, calendarName) =>
      formatDate
        ? formatDate('formatPlainDate', slot, calendarName)
        : call('formatPlainDate', {value: shortFields(slot), calendarName}),
    formatPlainDateTime: (value, calendar, precision, mode, calendarName) =>
      formatDateTime
        ? formatDateTime(value, calendar, precision, mode, calendarName)
        : call('formatPlainDateTime', {
            nanoseconds: text(value),
            calendar,
            precision,
            mode,
            calendarName,
          }),
    formatPlainYearMonth: (slot, calendarName) =>
      formatDate
        ? formatDate('formatPlainYearMonth', slot, calendarName)
        : call('formatPlainYearMonth', {
            value: shortFields(slot),
            calendarName,
          }),
    formatPlainMonthDay: (slot, calendarName) =>
      formatDate
        ? formatDate('formatPlainMonthDay', slot, calendarName)
        : call('formatPlainMonthDay', {value: shortFields(slot), calendarName}),
    formatZonedDateTime: (
      slot,
      precision,
      mode,
      calendarName,
      offset,
      timeZoneName
    ) =>
      call('formatZonedDateTime', {
        value: zonedFields(slot),
        precision,
        mode,
        calendarName,
        offset,
        timeZoneName,
      }),
    createISODate: (fields, overflow) => {
      if (fields.year === undefined) throw new BadType('Year required')
      if (fields.day === undefined) throw new BadType('Day required')
      if (fields.month === undefined && fields.monthCode === undefined)
        throw new BadType('Month or monthCode required')
      return dateResult(
        invoke?.createISODate
          ? invoke.createISODate(fields, overflow)
          : {
              epochDay: call('calendarToEpochDay', {
                calendar: 'iso8601',
                fields,
                overflow,
              }),
              calendar: 'iso8601',
            }
      )
    },
    parsePlainDate: value =>
      dateResult(
        parseDate
          ? parseDate(value, 'parsePlainDate')
          : call('parsePlainDate', {text: value})
      ),
    parsePlainDateTime: value =>
      timeResult(
        parseDateTime
          ? parseDateTime(value)
          : call('parsePlainDateTime', {text: value})
      ),
    parsePlainYearMonth: value =>
      dateResult(
        parseDate
          ? parseDate(value, 'parsePlainYearMonth')
          : call('parsePlainYearMonth', {text: value})
      ),
    parsePlainMonthDay: value =>
      dateResult(
        parseDate
          ? parseDate(value, 'parsePlainMonthDay')
          : call('parsePlainMonthDay', {text: value})
      ),
    parseZonedFields: value => {
      if (invoke?.parseZonedFields) return invoke.parseZonedFields(value)
      const result = call('parseZonedFields', {text: value})
      return {
        fields: result.fields,
        timeZone: result.timeZone,
        offset: result.offset ?? undefined,
        localNanoseconds: undefined,
        validatedTimeZone: undefined,
      }
    },
    resolveZonedDateTime: (
      value,
      identifier,
      calendar,
      offset,
      behavior,
      disambiguation,
      matchMinute,
      dateOnly
    ) =>
      timeResult(
        invoke?.resolveZonedDateTime
          ? invoke.resolveZonedDateTime(
              value,
              identifier,
              calendar,
              offset,
              behavior,
              disambiguation,
              matchMinute,
              dateOnly
            )
          : call('resolveZonedDateTime', {
              nanoseconds: text(value),
              identifier,
              calendar,
              offset,
              behavior,
              disambiguation,
              matchMinute,
              dateOnly,
            }),
        calendar,
        identifier
      ),
    addZonedDateTime: (slot, fields, subtract, overflow) =>
      timeResult(
        invoke?.addZonedDateTime
          ? invoke.addZonedDateTime(slot, fields, subtract, overflow)
          : call('addZonedDateTime', {
              value: zonedFields(slot),
              duration: durationFields(fields),
              subtract,
              overflow,
            }),
        slot.calendar,
        slot.timeZone
      ),
    differenceZonedDateTime: (
      start,
      end,
      largest,
      smallest,
      increment,
      mode,
      since
    ) =>
      call('differenceZonedDateTime', {
        value: zonedFields(start),
        other: zonedFields(end),
        largest,
        smallest,
        increment,
        mode,
        since,
      }),
    roundZonedDateTime: (slot, unit, increment, mode) =>
      timeResult(
        invoke?.roundZonedDateTime
          ? invoke.roundZonedDateTime(slot, unit, increment, mode)
          : call('roundZonedDateTime', {
              value: zonedFields(slot),
              unit,
              increment,
              mode,
            }),
        slot.calendar,
        slot.timeZone
      ),
    startOfZonedDay: (slot, day) =>
      timeResult(
        invoke?.startOfZonedDay
          ? invoke.startOfZonedDay(slot, day)
          : call('startOfZonedDay', {value: zonedFields(slot), day}),
        slot.calendar,
        slot.timeZone
      ),
    hoursInZonedDay: slot =>
      call('hoursInZonedDay', {value: zonedFields(slot)}),
    addPlainDate: (epochDay, calendar, fields, subtract, overflow) =>
      dateResult(
        addPlainDate
          ? addPlainDate(epochDay, calendar, fields, subtract, overflow)
          : call('addPlainDate', {
              epochDay,
              calendar,
              duration: durationFields(fields),
              subtract,
              overflow,
            }),
        calendar
      ),
    addPlainDateTime: (value, calendar, fields, subtract, overflow) =>
      timeResult(
        addDateTime
          ? addDateTime(value, calendar, fields, subtract, overflow)
          : call('addPlainDateTime', {
              nanoseconds: text(value),
              calendar,
              duration: durationFields(fields),
              subtract,
              overflow,
            }),
        calendar
      ),
    differencePlainDate: (
      start,
      end,
      calendar,
      largest,
      smallest,
      increment,
      mode,
      since
    ) =>
      call('differencePlainDate', {
        epochDay: start,
        other: end,
        calendar,
        largest,
        smallest,
        increment,
        mode,
        since,
      }),
    differencePlainDateTime: (
      start,
      end,
      calendar,
      largest,
      smallest,
      increment,
      mode,
      since
    ) =>
      call('differencePlainDateTime', {
        nanoseconds: text(start),
        other: text(end),
        calendar,
        largest,
        smallest,
        increment,
        mode,
        since,
      }),
    roundPlainDateTime: (value, calendar, unit, increment, mode) =>
      timeResult(
        roundDateTime
          ? roundDateTime(value, calendar, unit, increment, mode)
          : call('roundPlainDateTime', {
              nanoseconds: text(value),
              calendar,
              unit,
              increment,
              mode,
            }),
        calendar
      ),
    transformDuration: (fields, absolute) =>
      call('transformDuration', {duration: durationFields(fields), absolute}),
    parseDuration: value => call('parseDuration', {text: value}),
    validateDuration: fields => {
      call('validateDuration', {duration: durationFields(fields)})
    },
    formatDuration: (fields, precision, mode) =>
      invoke?.formatDuration
        ? invoke.formatDuration(fields, precision, mode)
        : call('formatDuration', {
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
    timeZoneTransition:
      invoke?.timeZoneTransition ??
      ((identifier, value, direction) => {
        const result = call('timeZoneTransition', {
          identifier,
          nanoseconds: text(value),
          direction,
        })
        return result === null ? null : ToBigInt(result)
      }),
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
    parsePlainTimeResult: value =>
      invoke?.parsePlainTimeResult
        ? invoke.parsePlainTimeResult(value)
        : clockResult(
            call('parsePlainTime', {text: value, clockSnapshot: true})
          ),
    regulatePlainTimeResult: (values, constrain) => {
      if (invoke?.regulatePlainTimeResult)
        return invoke.regulatePlainTimeResult(values, constrain)
      const fields = create(null)
      fields.hour = values[0]
      fields.minute = values[1]
      fields.second = values[2]
      fields.millisecond = values[3]
      fields.microsecond = values[4]
      fields.nanosecond = values[5]
      return clockResult(
        call('regulatePlainTime', {fields, constrain, clockSnapshot: true})
      )
    },
    addPlainTimeResult: (value, fields, subtract) =>
      invoke?.addPlainTimeResult
        ? invoke.addPlainTimeResult(value, fields, subtract)
        : clockResult(
            call('addPlainTime', {
              nanoseconds: clockText(value),
              duration: durationFields(fields),
              subtract,
              clockSnapshot: true,
            })
          ),
    roundPlainTimeResult: (value, unit, increment, mode) =>
      invoke?.roundPlainTimeResult
        ? invoke.roundPlainTimeResult(value, unit, increment, mode)
        : clockResult(
            call('roundPlainTime', {
              nanoseconds: clockText(value),
              unit,
              increment,
              mode,
              clockSnapshot: true,
            })
          ),
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
      invoke?.formatPlainTime
        ? invoke.formatPlainTime(value, precision, mode)
        : call('formatPlainTime', {
            nanoseconds: clockText(value),
            precision,
            mode,
          }),
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
      invoke?.differencePlainTime
        ? invoke.differencePlainTime(
            value,
            other,
            largest,
            smallest,
            increment,
            mode
          )
        : call('differencePlainTime', {
            nanoseconds: clockText(value),
            other: clockText(other),
            largest,
            smallest,
            increment,
            mode,
          }),
    parseInstant:
      invoke?.parseInstant ??
      (value => ToBigInt(call('parseInstant', {text: value}))),
    formatInstant:
      invoke?.formatInstant ??
      ((value, precision, offset, mode, identifier) =>
        call('formatInstant', {
          nanoseconds: text(value),
          precision,
          offset: offset === undefined ? undefined : text(offset),
          mode,
          identifier,
        })),
    addInstant:
      invoke?.addInstant ??
      ((value, fields, subtract) =>
        addition('addInstant', value, fields, subtract)),
    roundInstantUnit:
      invoke?.roundInstantUnit ??
      ((value, unit, increment, mode) =>
        ToBigInt(
          call('roundInstant', {
            nanoseconds: text(value),
            unit,
            increment,
            mode,
          })
        )),
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
