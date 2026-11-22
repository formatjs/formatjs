import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
export {
  allocateInstant,
  allocateSharedDateTime,
  allocateSharedDay,
  getSharedDateTimeSlot,
  getSharedDaySlot,
  allocateZonedDateTime,
  getSharedInstantSlot,
  getSharedZonedSlot,
  timeZoneMetadata,
  validateInstant,
  type DaySlotKind,
} from '#packages/temporal/epoch-slots.js'
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
  formatZonedDateTime?: NativeTemporal['formatZonedDateTime']
  addPlainYearMonth?: NativeTemporal['addPlainYearMonth']
  yearMonthToDate?: NativeTemporal['yearMonthToDate']
  monthDayToDate?: NativeTemporal['monthDayToDate']
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
  differencePlainYearMonth?: NativeTemporal['differencePlainYearMonth']
  differencePlainDate?: NativeTemporal['differencePlainDate']
  differencePlainDateTime?: NativeTemporal['differencePlainDateTime']
  differenceInstant?: NativeTemporal['differenceInstant']
  parseDuration?: NativeTemporal['parseDuration']
  addDuration?: NativeTemporal['addDuration']
  transformDuration?: NativeTemporal['transformDuration']
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
  // Validate syntax/fields only; callers read options before representability.
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
  // Temporal comparison §3.5.4 step 4.
  // Guard legacy JSON parse input against escaped code units.
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
  // Temporal comparison §12.3.31 step 2.a, §12.3.30 field requirements.
  // Check prepared non-ISO era pairs and month-day year information.
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
  // Temporal comparison §11.1.11 step 1.
  // Marshal prepared ISO fields for possible epoch lookup.
  function isoFields(fields: ISODateTime): Record<string, number> {
    const copy = create(null)
    copy.year = fields.year
    copy.month = fields.month
    copy.day = fields.day
    copy.hour = HasOwnProperty(fields, 'hour') ? (fields.hour ?? 0) : 0
    copy.minute = HasOwnProperty(fields, 'minute') ? (fields.minute ?? 0) : 0
    copy.second = HasOwnProperty(fields, 'second') ? (fields.second ?? 0) : 0
    copy.millisecond = HasOwnProperty(fields, 'millisecond')
      ? (fields.millisecond ?? 0)
      : 0
    copy.microsecond = HasOwnProperty(fields, 'microsecond')
      ? (fields.microsecond ?? 0)
      : 0
    copy.nanosecond = HasOwnProperty(fields, 'nanosecond')
      ? (fields.nanosecond ?? 0)
      : 0
    return copy
  }
  // Temporal comparison §11.1.10 step 2.
  // Transport the exact epoch to the ISO field projection.
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
  // Temporal comparison §8.5.5 step 1, §4.5.18 step 4.
  // Transport prepared epoch or clock addition operands.
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
  // Temporal comparison §4.5.2 step 3.
  // Decode native clock fields into a prepared time result.
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
  // Temporal comparison §8.5.10 step 6.
  // Marshal prepared duration fields for native instant addition.
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
  // Temporal comparison §12.3.12 step 2.
  // Marshal prepared calendar-date conversion fields.
  function dateFields(value: CalendarFields): Record<string, unknown> {
    const fields = create(null)
    fields.year = value.year
    if (value.month !== undefined) fields.month = value.month
    if (value.monthCode !== undefined) fields.monthCode = value.monthCode
    fields.day = value.day
    return fields
  }
  // Temporal comparison §3.5.11 steps 1, 4, §9.5.6 steps 1, 5, §10.5.3 steps 1, 5.
  // Marshal the private date and calendar for short formatting.
  function shortFields(slot: DateSlot): Record<string, unknown> {
    const result = create(null)
    result.epochDay = slot.epochDay
    result.calendar = slot.calendar
    return result
  }
  // Temporal comparison §6.5.4 steps 4, 6, 14.
  // Marshal the private zoned epoch, identifier and calendar.
  function zonedFields(slot: ZonedSlot): Record<string, unknown> {
    const result = create(null)
    result.nanoseconds = text(slot.epochNanoseconds)
    result.calendar = slot.calendar
    result.identifier = slot.timeZone
    return result
  }
  // Temporal comparison §7.3.20 steps 27.b, 27.c, 27.d, 28.c, 28.e.
  // Marshal the prepared zoned or plain duration anchor.
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
  // Temporal comparison §3.5.3 steps 4, 5.
  // Decode prepared date and calendar values for slot creation.
  function dateResult(value: any, calendar?: string): DateSlot {
    if (typeof value === 'number') return {epochDay: value, calendar: calendar!}
    if (value.properties) value.properties.owner = native
    return value
  }
  // Temporal comparison §5.5.8 steps 4, 5, §6.5.3 steps 4, 5, 6.
  // Decode the exact epoch and metadata for slot creation.
  function timeResult(value: any, calendar?: string, timeZone?: string): any {
    if (typeof value === 'string')
      return {epochNanoseconds: ToBigInt(value), calendar, timeZone}
    value.epochNanoseconds = ToBigInt(value.epochNanoseconds)
    if (value.properties) value.properties.owner = native
    return value
  }
  native = {
    // Temporal comparison §3.3.23 steps 7, 10, §9.3.13 steps 7, 10, §10.3.6 steps 7, 10.
    // Forward date or short-date field merge and conversion.
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
    // Temporal comparison §5.3.25 steps 13, 16.
    // Forward date-time field merge and conversion.
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
    // Temporal comparison §6.3.31 steps 18, 23, 25.
    // Forward zoned field merge and offset interpretation.
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
    // Temporal comparison §12.3.26 steps 1.b, 2.
    // Forward the date slot for calendar field projection.
    calendarProperties: (calendar, epoch, extended, nanoseconds) =>
      call('calendarProperties', {
        calendar,
        epoch,
        extended,
        nanoseconds: nanoseconds === undefined ? undefined : text(nanoseconds),
      }),
    // Temporal comparison §6.3.8 steps 3, 4.
    // Forward the zoned slot for local and calendar projection.
    zonedProperties: slot =>
      call('zonedProperties', {value: zonedFields(slot)}),
    // Temporal comparison §9.5.8 steps 11, 12, 14.
    // Forward year-month calendar addition and projection.
    addPlainYearMonth: (slot, fields, subtract, overflow) =>
      dateResult(
        invoke?.addPlainYearMonth
          ? invoke.addPlainYearMonth(slot, fields, subtract, overflow)
          : call('addPlainYearMonth', {
              value: shortFields(slot),
              duration: durationFields(fields),
              subtract,
              overflow,
            }),
        slot.calendar
      ),
    // Temporal comparison §9.5.7 steps 13, 16.e, 18.
    // Forward year-month difference, rounding and direction.
    differencePlainYearMonth: (
      start,
      end,
      largest,
      smallest,
      increment,
      mode,
      since
    ) =>
      invoke?.differencePlainYearMonth
        ? invoke.differencePlainYearMonth(
            start,
            end,
            largest,
            smallest,
            increment,
            mode,
            since
          )
        : call('differencePlainYearMonth', {
            value: shortFields(start),
            other: shortFields(end),
            largest,
            smallest,
            increment,
            mode,
            since,
          }),
    // Temporal comparison §9.3.23 steps 7, 8.
    // Forward the reference month and prepared day.
    yearMonthToDate: (slot, day) =>
      dateResult(
        invoke?.yearMonthToDate
          ? invoke.yearMonthToDate(slot, day)
          : call('yearMonthToDate', {value: shortFields(slot), day}),
        slot.calendar
      ),
    // Temporal comparison §10.3.12 steps 7, 8.
    // Forward the reference month-day and prepared year.
    monthDayToDate: (slot, year) =>
      dateResult(
        invoke?.monthDayToDate
          ? invoke.monthDayToDate(slot, year)
          : call('monthDayToDate', {value: shortFields(slot), year}),
        slot.calendar
      ),
    // Temporal comparison §3.5.11 steps 1, 2, 3, 4, 5.
    // Forward date and calendar display to native formatting.
    formatPlainDate: (slot, calendarName) =>
      formatDate
        ? formatDate('formatPlainDate', slot, calendarName)
        : call('formatPlainDate', {value: shortFields(slot), calendarName}),
    // Temporal comparison §5.5.9 steps 4, 5, 6, 7.
    // Forward date-time precision and calendar display.
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
    // Temporal comparison §9.5.6 steps 4.a, 5, 7.
    // Forward the reference day and calendar display.
    formatPlainYearMonth: (slot, calendarName) =>
      formatDate
        ? formatDate('formatPlainYearMonth', slot, calendarName)
        : call('formatPlainYearMonth', {
            value: shortFields(slot),
            calendarName,
          }),
    // Temporal comparison §10.5.3 steps 4.a, 5, 7.
    // Forward the reference year and calendar display.
    formatPlainMonthDay: (slot, calendarName) =>
      formatDate
        ? formatDate('formatPlainMonthDay', slot, calendarName)
        : call('formatPlainMonthDay', {value: shortFields(slot), calendarName}),
    // Temporal comparison §6.5.4 steps 5, 9, 11.a, 13.b, 14, 15.
    // Forward zoned precision and annotation display.
    formatZonedDateTime: (
      slot,
      precision,
      mode,
      calendarName,
      offset,
      timeZoneName
    ) =>
      invoke?.formatZonedDateTime
        ? invoke.formatZonedDateTime(
            slot,
            precision,
            mode,
            calendarName,
            offset,
            timeZoneName
          )
        : call('formatZonedDateTime', {
            value: zonedFields(slot),
            precision,
            mode,
            calendarName,
            offset,
            timeZoneName,
          }),
    // Temporal comparison §12.3.31 steps 1.e, 1.f, 1.g, §12.3.12 step 2.
    // Check required ISO fields before native date conversion.
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
    // Temporal comparison §3.5.4 steps 4, 5.
    // Forward the plain date string to native parsing.
    parsePlainDate: value =>
      dateResult(
        parseDate
          ? parseDate(value, 'parsePlainDate')
          : call('parsePlainDate', {text: value})
      ),
    // Temporal comparison §5.5.6 steps 4, 5.
    // Forward the plain date-time string to native parsing.
    parsePlainDateTime: value =>
      timeResult(
        parseDateTime
          ? parseDateTime(value)
          : call('parsePlainDateTime', {text: value})
      ),
    // Temporal comparison §9.5.2 steps 4, 14.
    // Forward the year-month string to native parsing and projection.
    parsePlainYearMonth: value =>
      dateResult(
        parseDate
          ? parseDate(value, 'parsePlainYearMonth')
          : call('parsePlainYearMonth', {text: value})
      ),
    // Temporal comparison §10.5.1 steps 4, 10.b, 15.
    // Forward the month-day string to native parsing and projection.
    parsePlainMonthDay: value =>
      dateResult(
        parseDate
          ? parseDate(value, 'parsePlainMonthDay')
          : call('parsePlainMonthDay', {text: value})
      ),
    // Temporal comparison §6.5.2 steps 5.b, 5.c, 5.f.
    // Forward zoned string parsing and unpack its fields.
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
    // Temporal comparison §6.5.2 step 11.
    // Forward prepared offset matching and disambiguation.
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
    // Temporal comparison §6.5.10 step 8.
    // Forward zoned duration addition with overflow and sign.
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
    // Temporal comparison §6.5.9 steps 5.a, 9.
    // Forward both zoned endpoints and difference settings.
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
    // Temporal comparison §6.3.39 steps 19.i, 20.a, 20.c.
    // Forward zoned day or clock rounding.
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
    // Temporal comparison §6.3.45 step 6, §6.5.1 step 1.c.
    // Forward the zoned start-of-day calculation.
    startOfZonedDay: (slot, day) =>
      timeResult(
        invoke?.startOfZonedDay
          ? invoke.startOfZonedDay(slot, day)
          : call('startOfZonedDay', {value: zonedFields(slot), day}),
        slot.calendar,
        slot.timeZone
      ),
    // Temporal comparison §6.3.23 steps 7, 8, 9, 10.
    // Forward the zoned day-length calculation.
    hoursInZonedDay: slot =>
      call('hoursInZonedDay', {value: zonedFields(slot)}),
    // Temporal comparison §3.5.15 step 7.
    // Forward prepared calendar-date addition.
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
    // Temporal comparison §5.5.16 steps 6, 8, 9.
    // Forward date-time addition and calendar balancing.
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
    // Temporal comparison §3.5.14 steps 6, 8.e, 10.
    // Forward date difference, optional rounding and direction.
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
      invoke?.differencePlainDate
        ? invoke.differencePlainDate(
            start,
            end,
            calendar,
            largest,
            smallest,
            increment,
            mode,
            since
          )
        : call('differencePlainDate', {
            epochDay: start,
            other: end,
            calendar,
            largest,
            smallest,
            increment,
            mode,
            since,
          }),
    // Temporal comparison §5.5.15 steps 6, 8.
    // Forward date-time difference, rounding and direction.
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
      invoke?.differencePlainDateTime
        ? invoke.differencePlainDateTime(
            start,
            end,
            calendar,
            largest,
            smallest,
            increment,
            mode,
            since
          )
        : call('differencePlainDateTime', {
            nanoseconds: text(start),
            other: text(end),
            calendar,
            largest,
            smallest,
            increment,
            mode,
            since,
          }),
    // Temporal comparison §5.5.11 steps 2, 3, 4.
    // Forward local clock rounding and day carry.
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
      // Proposal comparison §§7.3.16–7.3.17 step3: transport to Duration::negated/abs.
      invoke?.transformDuration
        ? invoke.transformDuration(fields, absolute)
        : call('transformDuration', {
            duration: durationFields(fields),
            absolute,
          }),
    parseDuration: value =>
      // Proposal comparison §13.37: parser dependency; Rust Duration::from_str owns syntax.
      invoke?.parseDuration
        ? invoke.parseDuration(value)
        : call('parseDuration', {text: value}),
    validateDuration: fields => {
      // Proposal comparison §7.5.16 steps1–9: transport to Duration::new validation.
      call('validateDuration', {duration: durationFields(fields)})
    },
    formatDuration: (fields, precision, mode) =>
      // Proposal comparison §7.5.40: formatting dependency; Duration::format owns output.
      invoke?.formatDuration
        ? invoke.formatDuration(fields, precision, mode)
        : call('formatDuration', {
            duration: durationFields(fields),
            precision,
            mode,
          }),
    addDuration: (one, two, subtract) =>
      // Proposal comparison §7.5.41 steps2–11: transport to checked_add/checked_subtract.
      invoke?.addDuration
        ? invoke.addDuration(one, two, subtract)
        : call('addDuration', {
            duration: durationFields(one),
            other: durationFields(two),
            subtract,
          }),
    compareDuration: (one, two, relative) =>
      // Proposal comparison §7.2.3 steps12–17: DurationAnchor::compare/compare_time dependency.
      call('compareDuration', {
        duration: durationFields(one),
        other: durationFields(two),
        relative: relativeFields(relative),
      }),
    totalDuration: (fields, unit, relative) =>
      // Proposal comparison §7.3.21 steps12–15: DurationAnchor::total/Duration::total dependency.
      call('totalDuration', {
        duration: durationFields(fields),
        unit,
        relative: relativeFields(relative),
      }),
    roundDuration: (fields, largest, smallest, increment, mode, relative) =>
      // Proposal comparison §7.3.20 steps27–34: DurationAnchor::round/Duration::round dependency.
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
      // Proposal comparison §11.1.13 step5: transport private candidate List.
      // https://tc39.es/proposal-temporal/#sec-temporal-getpossibleepochnanoseconds
      const result: bigint[] = []
      for (let index = 0; index < values.length; index++)
        result[index] = ToBigInt(values[index])
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
      invoke?.differenceInstant
        ? invoke.differenceInstant(
            value,
            other,
            largest,
            smallest,
            increment,
            mode
          )
        : call('differenceInstant', {
            nanoseconds: text(value),
            other: text(other),
            largest,
            smallest,
            increment,
            mode,
          }),
  }
}
