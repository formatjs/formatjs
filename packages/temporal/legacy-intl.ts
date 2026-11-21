import {createObject} from '#packages/temporal/intrinsics.js'
import {
  registerTemporalDateTimeNamespace,
  ToDateTimeFormattable,
  type TemporalDateTimeValue,
} from '#packages/ecma402-abstract/DateTimeFormat/TemporalDateTime.js'
import {isTemporalDateTimeValue} from '#packages/ecma402-abstract/DateTimeFormat/HandleDateTimeValue.js'
import {
  legacyDateTimeProjection,
  legacyDateTimeOption,
} from '#packages/temporal/locale.js'
import type {TemporalNamespace} from '#packages/temporal/index.js'
import {
  legacyDateTimeFormat,
  legacyDateTimeParts,
  legacyDateTimeRangeFormat,
  legacyDateTimeRangeParts,
  type LegacyDateTimeProjection as Projection,
} from '#packages/temporal/legacy-extended-date.js'

const now = Date.now

export function installLegacyDateTimeFormat(
  namespace: TemporalNamespace
): void {
  const Native = globalThis.Intl?.DateTimeFormat as
    | (Intl.DateTimeFormatConstructor & {__formatTemporal?: unknown})
    | undefined
  if (!Native || Native.__formatTemporal) return
  registerTemporalDateTimeNamespace(namespace)
  const nativeFormat = Object.getOwnPropertyDescriptor(
    Native.prototype,
    'format'
  )!.get!
  const nativeParts = Native.prototype.formatToParts
  const nativeRange = Native.prototype.formatRange
  const nativeRangeParts = Native.prototype.formatRangeToParts
  const nativeResolved = Native.prototype.resolvedOptions
  const intrinsics = {
    resolvedOptions: nativeResolved,
    formatToParts: nativeParts,
  }
  interface State {
    formatter: Intl.DateTimeFormat
    locale: string
    calendar: string
    options: Record<string, unknown>
    bound?: (value?: unknown) => string
    projections: Map<string, Intl.DateTimeFormat>
  }
  const states = new WeakMap<object, State>()
  // Native bound functions identify the formatter without rereading its legacy symbol.
  const boundStates = new WeakMap<Function, State>()
  const probe = createObject(Native.prototype)
  const chained = Reflect.apply(Native, probe, [])
  const legacySymbol =
    chained === probe ? Object.getOwnPropertySymbols(probe)[0] : undefined
  const hasInstance = Function.prototype[Symbol.hasInstance]
  function project(state: State, value: TemporalDateTimeValue): Projection {
    if (value.kind === 'ZonedDateTime')
      throw new TypeError(
        'Temporal.ZonedDateTime is not supported by DateTimeFormat'
      )
    if (
      value.calendar !== undefined &&
      value.calendar !== state.calendar &&
      (value.calendar !== 'iso8601' ||
        value.kind === 'PlainYearMonth' ||
        value.kind === 'PlainMonthDay')
    )
      throw new RangeError('Temporal calendar does not match DateTimeFormat')
    const cached = state.projections.get(value.kind)
    if (cached) {
      const ns = value.epochNanoseconds
      return {
        formatter: cached,
        plain: value.kind !== 'Instant',
        milliseconds: Number(
          ns / 1_000_000n - (ns < 0n && ns % 1_000_000n ? 1n : 0n)
        ),
      }
    }
    const result = legacyDateTimeProjection(
      Native!,
      value,
      state.locale,
      state.options,
      false,
      intrinsics
    )
    state.projections.set(value.kind, result.formatter)
    return result
  }
  function single(state: State, input: unknown): Projection | undefined {
    if (input === undefined)
      return state.calendar !== 'gregory' && state.calendar !== 'iso8601'
        ? {formatter: state.formatter, milliseconds: now()}
        : undefined
    const value = ToDateTimeFormattable(input)
    return isTemporalDateTimeValue(value)
      ? project(state, value)
      : {formatter: state.formatter, milliseconds: value.toNumber()}
  }
  function range(
    state: State,
    start: unknown,
    end: unknown
  ): [Projection, Projection] {
    if (start === undefined || end === undefined)
      throw new TypeError('DateTimeFormat range requires two values')
    const first = ToDateTimeFormattable(start)
    const last = ToDateTimeFormattable(end)
    const firstTemporal = isTemporalDateTimeValue(first)
    const lastTemporal = isTemporalDateTimeValue(last)
    if (!firstTemporal && !lastTemporal)
      return [
        {formatter: state.formatter, milliseconds: first.toNumber()},
        {formatter: state.formatter, milliseconds: last.toNumber()},
      ]
    if (!firstTemporal || !lastTemporal || first.kind !== last.kind)
      throw new TypeError(
        'DateTimeFormat range requires matching Temporal types'
      )
    return [project(state, first), project(state, last)]
  }
  function create(
    locales: unknown,
    options: unknown,
    newTarget: Function
  ): Intl.DateTimeFormat {
    let source: Record<PropertyKey, unknown> | undefined
    const snapshot: Record<string, unknown> = createObject(null)
    const tracked = new Proxy(createObject(null), {
      get(_target, key) {
        if (!source) {
          if (options === null) throw new TypeError('Invalid options')
          source = options === undefined ? createObject(null) : Object(options)
        }
        const raw = source![key]
        if (typeof key !== 'string' || raw === undefined) return raw
        const value = legacyDateTimeOption(key, raw)
        snapshot[key] = value
        return value
      },
    })
    const formatter = Reflect.construct(
      Native!,
      [locales, tracked],
      newTarget
    ) as Intl.DateTimeFormat
    const resolved = nativeResolved.call(formatter)
    const state: State = {
      formatter,
      locale: resolved.locale,
      calendar: resolved.calendar,
      options: snapshot,
      projections: new Map(),
    }
    states.set(formatter, state)
    boundStates.set(nativeFormat.call(formatter), state)
    return formatter
  }
  class LegacyDateTimeFormat {
    get format(): (value?: unknown) => string {
      const bound = nativeFormat.call(this)
      const state = boundStates.get(bound)
      if (!state) return bound
      if (!state.bound) {
        state.bound = (input?: unknown): string => {
          const value = single(state, input)
          return value
            ? legacyDateTimeFormat(
                value,
                nativeFormat,
                nativeParts,
                nativeResolved
              )
            : nativeFormat.call(state.formatter)()
        }
        Object.defineProperty(state.bound, 'name', {value: ''})
      }
      return state.bound
    }
    formatToParts(input?: unknown): Intl.DateTimeFormatPart[] {
      const state = states.get(this)
      if (!state) return Reflect.apply(nativeParts, this, [input])
      const value = single(state, input)
      return value
        ? legacyDateTimeParts(value, nativeParts, nativeResolved)
        : nativeParts.call(state.formatter)
    }
    formatRange(start: unknown, end: unknown): string {
      const state = states.get(this)
      if (!state) return Reflect.apply(nativeRange, this, [start, end])
      const [first, last] = range(state, start, end)
      return legacyDateTimeRangeFormat(
        first,
        last,
        nativeRange,
        nativeRangeParts,
        nativeResolved
      )
    }
    formatRangeToParts(
      start: unknown,
      end: unknown
    ): Intl.DateTimeRangeFormatPart[] {
      const state = states.get(this)
      if (!state) return Reflect.apply(nativeRangeParts, this, [start, end])
      const [first, last] = range(state, start, end)
      return legacyDateTimeRangeParts(
        first,
        last,
        nativeRangeParts,
        nativeResolved
      )
    }
    resolvedOptions(): Intl.ResolvedDateTimeFormatOptions {
      return Reflect.apply(nativeResolved, this, [])
    }
  }
  function DateTimeFormat(
    this: unknown,
    locales: unknown = undefined,
    options: unknown = undefined
  ): Intl.DateTimeFormat {
    const formatter = create(locales, options, new.target || DateTimeFormat)
    if (!new.target && legacySymbol && hasInstance.call(Native, this)) {
      Object.defineProperty(this, legacySymbol, {
        value: formatter,
        writable: false,
        enumerable: false,
        configurable: false,
      })
      return this as Intl.DateTimeFormat
    }
    return formatter
  }
  Object.defineProperties(DateTimeFormat, {
    ...Object.getOwnPropertyDescriptors(Native),
    __addTemporalNamespace: {value: registerTemporalDateTimeNamespace},
    __formatTemporal: {
      value(
        value: TemporalDateTimeValue,
        locales?: unknown,
        options?: unknown,
        localNanoseconds?: () => bigint
      ): string {
        const result = legacyDateTimeProjection(
          Native!,
          value,
          locales,
          options,
          true,
          intrinsics,
          localNanoseconds
        )
        return legacyDateTimeFormat(
          result,
          nativeFormat,
          nativeParts,
          nativeResolved
        )
      },
    },
  })
  const descriptors: Record<PropertyKey, PropertyDescriptor> =
    Object.getOwnPropertyDescriptors(LegacyDateTimeFormat.prototype)
  if (!nativeRange) delete descriptors.formatRange
  if (!nativeRangeParts) delete descriptors.formatRangeToParts
  Object.defineProperties(Native.prototype, {
    ...descriptors,
    constructor: {value: DateTimeFormat, writable: true, configurable: true},
    [Symbol.toStringTag]: {value: 'Intl.DateTimeFormat', configurable: true},
  })
  globalThis.Intl.DateTimeFormat =
    DateTimeFormat as unknown as Intl.DateTimeFormatConstructor
}
