import {chinese} from '@formatjs_generated/icu.calendar/chinese.js'
import {dangi} from '@formatjs_generated/icu.calendar/dangi.js'
import {ummAlQura} from '@formatjs_generated/icu.calendar/umm-al-qura.js'
import primary from '@formatjs_generated/tz/primary.js'
import links from '@formatjs_generated/tz/links.js'
import packed from '@formatjs_generated/tz/all-tz.js'

declare global {
  interface ImportMeta {
    readonly formatjsTemporalNativeData?: boolean
  }
}
const nativeDataOnly = import.meta.formatjsTemporalNativeData === true
function unavailable(): never {
  throw new RangeError(
    'Temporal native build requires Rust calendar and timezone data'
  )
}
export function fallbackLunisolar(
  calendar: 'chinese' | 'dangi'
): typeof chinese {
  return nativeDataOnly
    ? unavailable()
    : calendar === 'chinese'
      ? chinese
      : dangi
}
export function fallbackUmmAlQura(): typeof ummAlQura {
  return nativeDataOnly ? unavailable() : ummAlQura
}
export function fallbackTimeZones(): {
  primary: typeof primary
  links: typeof links
  packed: typeof packed
} {
  return nativeDataOnly ? unavailable() : {primary, links, packed}
}
