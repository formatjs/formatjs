import {
  registerTemporalDurationNamespace,
  ToTemporalDurationRecord,
  type TemporalDurationNamespace,
} from '#packages/ecma402-abstract/DurationFormat/ToTemporalDurationRecord.js'
import type {DurationInput} from '#packages/ecma402-abstract/types/duration.js'

export function installLegacyDurationFormat(
  namespace: TemporalDurationNamespace
): void {
  const Native = (
    globalThis.Intl as
      | (typeof Intl & {
          DurationFormat?: {
            prototype: {
              resolvedOptions: (this: unknown) => unknown
              format: (this: unknown, duration: unknown) => string
              formatToParts: (this: unknown, duration: unknown) => unknown
            }
            __addTemporalNamespace?: (
              namespace: TemporalDurationNamespace
            ) => void
          }
        })
      | undefined
  )?.DurationFormat
  if (!Native || Native.__addTemporalNamespace) return
  registerTemporalDurationNamespace(namespace)
  const prototype = Native.prototype,
    resolved = prototype.resolvedOptions,
    apply = Reflect.apply
  for (const method of ['format', 'formatToParts'] as const) {
    const original = prototype[method],
      descriptor = Object.getOwnPropertyDescriptor(prototype, method)!
    const wrapper = {
      [method](this: unknown, duration: DurationInput | string): unknown {
        apply(resolved, this, [])
        return apply(original, this, [ToTemporalDurationRecord(duration)])
      },
    }[method]
    Object.defineProperty(prototype, method, {...descriptor, value: wrapper})
  }
  Object.defineProperty(Native, '__addTemporalNamespace', {
    value: registerTemporalDurationNamespace,
    writable: true,
    configurable: true,
  })
}
