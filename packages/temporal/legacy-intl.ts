import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  numberFrom,
} from '#packages/ecma262-abstract/intrinsics.js'
import {createObject, createProxy} from '#packages/temporal/intrinsics.js'
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
const apply = Reflect.apply
const construct = Reflect.construct
const WeakMapConstructor = WeakMap
const MapConstructor = Map
const weakMapGet = WeakMap.prototype.get
const weakMapSet = WeakMap.prototype.set
const mapGet = Map.prototype.get
const mapSet = Map.prototype.set

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
  const states = new WeakMapConstructor<object, State>()
  // Native bound functions identify the formatter without rereading its legacy symbol.
  const boundStates = new WeakMapConstructor<Function, State>()
  const probe = createObject(Native.prototype)
  const chained = apply(Native, probe, [])
  const legacySymbol =
    chained === probe ? Object.getOwnPropertySymbols(probe)[0] : undefined
  const hasInstance = Function.prototype[Symbol.hasInstance]
  function project(state: State, value: TemporalDateTimeValue): Projection {
    if (value.kind === 'ZonedDateTime')
      throw new TypeErrorConstructor(
        'Temporal.ZonedDateTime is not supported by DateTimeFormat'
      )
    if (
      value.calendar !== undefined &&
      value.calendar !== state.calendar &&
      (value.calendar !== 'iso8601' ||
        value.kind === 'PlainYearMonth' ||
        value.kind === 'PlainMonthDay')
    )
      throw new RangeErrorConstructor(
        'Temporal calendar does not match DateTimeFormat'
      )
    const cached: Intl.DateTimeFormat | undefined = apply(
      mapGet,
      state.projections,
      [value.kind]
    )
    if (cached) {
      const ns = value.epochNanoseconds
      return {
        formatter: cached,
        plain: value.kind !== 'Instant',
        milliseconds: numberFrom(
          ns / 1_000_000n - (ns < 0n && ns % 1_000_000n ? 1n : 0n)
        ),
      }
    }
    // ECMA-402 §11.5.5 step 7: Project the Temporal record for the host pattern
    // call.
    const result = legacyDateTimeProjection(
      Native!,
      value,
      state.locale,
      state.options,
      false,
      intrinsics
    )
    apply(mapSet, state.projections, [value.kind, result.formatter])
    return result
  }
  function single(state: State, input: unknown): Projection | undefined {
    // ECMA-402 §11.3.6 steps 3–4: Use the native default or prepare the
    // supplied value.
    if (input === undefined)
      return state.calendar !== 'gregory' && state.calendar !== 'iso8601'
        ? {formatter: state.formatter, milliseconds: now()}
        : undefined
    const value = ToDateTimeFormattable(input)
    return isTemporalDateTimeValue(value)
      ? project(state, value)
      : {formatter: state.formatter, milliseconds: value}
  }
  function range(
    state: State,
    start: unknown,
    end: unknown
  ): [Projection, Projection] {
    // ECMA-402 §11.3.4 steps 3–5: Reject missing endpoints, then prepare start
    // before end.
    if (start === undefined || end === undefined)
      throw new TypeErrorConstructor('DateTimeFormat range requires two values')
    const first = ToDateTimeFormattable(start)
    const last = ToDateTimeFormattable(end)
    const firstTemporal = isTemporalDateTimeValue(first)
    const lastTemporal = isTemporalDateTimeValue(last)
    if (!firstTemporal && !lastTemporal)
      return [
        {formatter: state.formatter, milliseconds: first},
        {formatter: state.formatter, milliseconds: last},
      ]
    if (!firstTemporal || !lastTemporal || first.kind !== last.kind)
      throw new TypeErrorConstructor(
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
    const tracked = createProxy(createObject(null), {
      get(_target, key) {
        // ECMA-402 §11.1.2 step 4: Record options as the host resolves them.
        if (source === undefined) {
          if (options === null)
            throw new TypeErrorConstructor('Invalid options')
          source = options === undefined ? createObject(null) : Object(options)
        }
        const raw = source![key]
        if (typeof key !== 'string' || raw === undefined) return raw
        const value = legacyDateTimeOption(key, raw)
        snapshot[key] = value
        return value
      },
    })
    // ECMA-402 §11.1.1 step 2: Delegate formatter construction to the host.
    const formatter = construct(
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
      projections: new MapConstructor(),
    }
    apply(weakMapSet, states, [formatter, state])
    apply(weakMapSet, boundStates, [nativeFormat.call(formatter), state])
    return formatter
  }
  class LegacyDateTimeFormat {
    get format(): (value?: unknown) => string {
      // ECMA-402 §11.3.3 steps 4–5: Reuse the native bound formatter or the
      // cached adapter.
      const bound = nativeFormat.call(this)
      const state: State | undefined = apply(weakMapGet, boundStates, [bound])
      if (!state) return bound
      if (!state.bound) {
        state.bound = (input?: unknown): string => {
          // ECMA-402 §11.3.3 steps 4.a.i–ii: Prepare the bound call input and
          // return its formatted value.
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
      const state: State | undefined = apply(weakMapGet, states, [this])
      if (!state) return apply(nativeParts, this, [input])
      // ECMA-402 §11.3.6 step 5: Route the prepared value to its parts
      // formatter.
      const value = single(state, input)
      return value
        ? legacyDateTimeParts(value, nativeParts, nativeResolved)
        : nativeParts.call(state.formatter)
    }
    formatRange(start: unknown, end: unknown): string {
      const state: State | undefined = apply(weakMapGet, states, [this])
      if (!state) return apply(nativeRange, this, [start, end])
      // ECMA-402 §11.3.4 step 6: Return the formatted range for the prepared
      // endpoints.
      const endpoints = range(state, start, end)
      return legacyDateTimeRangeFormat(
        endpoints[0],
        endpoints[1],
        nativeRange,
        nativeRangeParts,
        nativeResolved
      )
    }
    formatRangeToParts(
      start: unknown,
      end: unknown
    ): Intl.DateTimeRangeFormatPart[] {
      const state: State | undefined = apply(weakMapGet, states, [this])
      if (!state) return apply(nativeRangeParts, this, [start, end])
      // ECMA-402 §11.3.5 step 6: Return the range parts for the prepared
      // endpoints.
      const endpoints = range(state, start, end)
      return legacyDateTimeRangeParts(
        endpoints[0],
        endpoints[1],
        nativeRangeParts,
        nativeResolved
      )
    }
    resolvedOptions(): Intl.ResolvedDateTimeFormatOptions {
      // ECMA-402 §11.3.2 step 6: Return the host's resolved options record.
      return apply(nativeResolved, this, [])
    }
  }
  function DateTimeFormat(
    this: unknown,
    locales: unknown = undefined,
    options: unknown = undefined
  ): Intl.DateTimeFormat {
    // ECMA-402 §11.1.1 step 2: Create the formatter with the selected
    // constructor target.
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
        // ECMA-402 §11.5.6 step 1: Pass the private Temporal projection to the
        // formatter.
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
