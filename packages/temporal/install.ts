import {configureLocaleFormatting} from '#packages/temporal/locale.js'
import {
  Temporal,
  toTemporalInstant,
  type TemporalNamespace,
} from '#packages/temporal/index.js'
import {createDateToTemporalInstant} from '#packages/temporal/date-bridge.js'
import {needsTemporal} from '#packages/temporal/detect.js'
import {installLegacyDateTimeFormat} from '#packages/temporal/legacy-intl.js'
import {installLegacyDurationFormat} from '#packages/temporal/legacy-durationformat.js'

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
  if (replace || target.Temporal === Temporal) {
    installLegacyDateTimeFormat(target.Temporal)
    installLegacyDurationFormat(target.Temporal)
  }
  const Formatter = globalThis.Intl?.DateTimeFormat as
    | (typeof Intl.DateTimeFormat & {
        __addTemporalNamespace?: (namespace: TemporalNamespace) => void
      })
    | undefined
  Formatter?.__addTemporalNamespace?.(target.Temporal)
  const DurationFormatter = (
    globalThis.Intl as
      | (typeof Intl & {
          DurationFormat?: {
            __addTemporalNamespace?: (namespace: TemporalNamespace) => void
          }
        })
      | undefined
  )?.DurationFormat
  DurationFormatter?.__addTemporalNamespace?.(target.Temporal)
  configureLocaleFormatting()
  if (replace || typeof date.toTemporalInstant !== 'function') {
    const Constructor = target.Temporal.Instant
    Object.defineProperty(date, 'toTemporalInstant', {
      // Temporal comparison §14.9.1 step 5.
      // Create the result through the installed Instant provider.
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
