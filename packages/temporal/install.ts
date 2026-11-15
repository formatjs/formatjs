import {configureLocaleFormatting} from '#packages/temporal/locale.js'
import {
  Temporal,
  toTemporalInstant,
  type TemporalNamespace,
} from '#packages/temporal/index.js'
import {createDateToTemporalInstant} from '#packages/temporal/date-bridge.js'
import {needsTemporal} from '#packages/temporal/detect.js'

export function installTemporal(force = false): void {
  const target = globalThis as typeof globalThis & {
      Temporal: TemporalNamespace
    },
    date = Date.prototype as Date & {toTemporalInstant?: () => unknown},
    replace = force || needsTemporal()
  if (replace)
    Object.defineProperty(target, 'Temporal', {
      value: Temporal,
      writable: true,
      configurable: true,
      enumerable: false,
    })
  const Formatter = globalThis.Intl?.DateTimeFormat as
    | (typeof Intl.DateTimeFormat & {
        __addTemporalNamespace?: (namespace: TemporalNamespace) => void
      })
    | undefined
  Formatter?.__addTemporalNamespace?.(target.Temporal)
  configureLocaleFormatting()
  if (replace || typeof date.toTemporalInstant !== 'function') {
    const Constructor = target.Temporal.Instant
    Object.defineProperty(date, 'toTemporalInstant', {
      value:
        target.Temporal === Temporal
          ? toTemporalInstant
          : createDateToTemporalInstant(ns => new Constructor(ns)),
      enumerable: false,
      writable: true,
      configurable: true,
    })
  }
}
