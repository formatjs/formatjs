import {
  RangeErrorConstructor,
  arraySome,
  floor,
  numberFrom,
} from '#packages/ecma262-abstract/intrinsics.js'
import {
  createHostTimeZoneOffset,
  type HostTimeZone,
} from '#packages/temporal/host-timezone.js'
import {
  legacyTimeZoneName,
  type LegacyDateTimeProjection,
} from '#packages/temporal/legacy-extended-date.js'

type Parts = typeof Intl.DateTimeFormat.prototype.formatToParts
const zones = new WeakMap<
  Intl.DateTimeFormatConstructor,
  Map<string, HostTimeZone['offsetNanoseconds'] | undefined>
>()
const NumberConstructor = globalThis.Intl?.NumberFormat
const numberFormat =
  NumberConstructor &&
  Object.getOwnPropertyDescriptor(NumberConstructor.prototype, 'format')?.get

export function legacyHostTimeZone(
  Constructor: Intl.DateTimeFormatConstructor,
  timeZone: string,
  parts: Parts
): HostTimeZone['offsetNanoseconds'] | undefined {
  let cache = zones.get(Constructor)
  if (!cache) {
    cache = new Map()
    zones.set(Constructor, cache)
  }
  if (cache.has(timeZone)) return cache.get(timeZone)
  let zone: HostTimeZone['offsetNanoseconds'] | undefined
  try {
    // ECMA-402 §11.5.11 step 2.b: Reuse the host offset reader for the named
    // zone.
    zone = createHostTimeZoneOffset(timeZone, {Constructor, parts})
  } catch (error) {
    if (!(error instanceof RangeErrorConstructor)) throw error
  }
  cache.set(timeZone, zone)
  return zone
}

export function legacyZonedProjection(
  Constructor: Intl.DateTimeFormatConstructor,
  resolved: Intl.ResolvedDateTimeFormatOptions,
  selected: Record<string, unknown>,
  local: bigint,
  offset: bigint,
  parts: Parts
): LegacyDateTimeProjection {
  // ECMA-402 §11.5.11 step 3: Format the offset-adjusted local scalar in UTC.
  const formatter = new Constructor(resolved.locale, {
    __proto__: null,
    ...selected,
    timeZone: 'UTC',
  } as Intl.DateTimeFormatOptions)
  const probe = parts.call(formatter, 0)
  let timeZoneName: string | undefined
  if (arraySome(probe, part => part.type === 'timeZoneName')) {
    const long =
      selected.timeZoneName === 'long' ||
      selected.timeZoneName === 'longOffset' ||
      selected.timeZoneName === 'longGeneric' ||
      selected.timeStyle === 'full'
    timeZoneName = offsetName(Constructor, resolved, offset, long, parts)
  }
  const ms = local / 1_000_000n - (local < 0n && local % 1_000_000n ? 1n : 0n)
  return {
    formatter,
    milliseconds: numberFrom(ms),
    plain: true,
    [legacyTimeZoneName]: timeZoneName,
  }
}

function offsetName(
  Constructor: Intl.DateTimeFormatConstructor,
  resolved: Intl.ResolvedDateTimeFormatOptions,
  offset: bigint,
  long: boolean,
  parts: Parts
): string {
  const label = (timeZone: string, long: boolean, latin = false): string =>
    // ECMA-402 §11.5.4 step 15.e.iv: Sample the host zone label at the
    // requested width.
    parts
      .call(
        new Constructor(resolved.locale, {
          timeZone,
          timeZoneName: long ? 'long' : 'short',
          numberingSystem: latin ? 'latn' : resolved.numberingSystem,
          hour: 'numeric',
        }),
        0
      )
      .find(part => part.type === 'timeZoneName')!.value
  // ECMA-402 §11.5.4 step 15.e.iv: Build the localized offset label from host
  // controls.
  if (offset === 0n) return label('Etc/GMT', long)
  const pattern = label(offset < 0n ? 'Etc/GMT+1' : 'Etc/GMT-1', long, true)
  const separator = /01(\D+)00/.exec(label('Etc/GMT-1', true, true))?.[1] ?? ':'
  const numberingSystem =
    resolved.numberingSystem === 'latn' || /01/.test(label('Etc/GMT-1', true))
      ? 'latn'
      : resolved.numberingSystem
  const seconds = numberFrom((offset < 0n ? -offset : offset) / 1_000_000_000n)
  const hour = floor(seconds / 3600),
    minute = floor((seconds % 3600) / 60),
    second = seconds % 60
  if (!NumberConstructor || !numberFormat)
    throw new RangeErrorConstructor(
      'Timezone offset labels require Intl.NumberFormat'
    )
  const numeric = (digits: number): ((value: number) => string) =>
    // ECMA-402 §11.5.4 steps 3–10: Use localized integer digits in the offset
    // label.
    numberFormat.call(
      new NumberConstructor(resolved.locale, {
        numberingSystem,
        minimumIntegerDigits: digits,
        useGrouping: false,
        maximumFractionDigits: 0,
      })
    )
  const number = numeric(long ? 2 : 1),
    two = numeric(2)
  const replacement =
    number(hour) +
    (long || minute || second ? separator + two(minute) : '') +
    (second ? separator + two(second) : '')
  return pattern.replace(/0?1(?:\D+00)?/, replacement)
}
