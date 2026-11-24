import {
  createFromConstructor,
  nullClassBase,
} from '#packages/ecma262-abstract/intrinsics.js'
import {
  canonicalizeLocaleDataTag,
  registerLocaleData,
} from '#packages/ecma402-abstract/registerLocaleData.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {SupportedLocales} from '#packages/ecma402-abstract/SupportedLocales.js'
import {
  type LocaleFieldsData,
  type RelativeTimeLocaleData,
} from '#packages/ecma402-abstract/types/relative-time.js'
import {InitializeRelativeTimeFormat} from '#packages/ecma402-abstract/RelativeTimeFormat/InitializeRelativeTimeFormat.js'
import {PartitionRelativeTimePattern} from '#packages/ecma402-abstract/RelativeTimeFormat/PartitionRelativeTimePattern.js'
import getInternalSlots, {
  requireInternalSlots,
} from '#packages/intl-relativetimeformat/get_internal_slots.js'

// ECMA-402 §9.2.7 step 3 resolves the internal default locale.
// https://tc39.es/ecma402/#sec-resolvelocale
let defaultLocale = ''
function getDefaultLocale(): string {
  return defaultLocale
}

// Class syntax supplies the prototype and constructor descriptors.
// ECMA-402 §18.2.1 https://tc39.es/ecma402/#sec-Intl.RelativeTimeFormat.prototype
// ECMA-402 §18.3.1 https://tc39.es/ecma402/#sec-Intl.RelativeTimeFormat.prototype.constructor
export default class RelativeTimeFormat extends nullClassBase {
  // ECMA-402 §18.1.1: class construction requires new, then initializes slots.
  // https://tc39.es/ecma402/#sec-Intl.RelativeTimeFormat
  // @ts-expect-error TS2377: extends null and returns its own receiver.
  // oxlint-disable-next-line constructor-super -- The constructor returns its allocated receiver.
  constructor(
    locales?: string | string[],
    options?: Intl.RelativeTimeFormatOptions
  ) {
    const receiver = createFromConstructor(
      new.target,
      RelativeTimeFormat.prototype
    )
    return InitializeRelativeTimeFormat(receiver, locales, options, {
      getInternalSlots,
      availableLocales: RelativeTimeFormat.availableLocales,
      relevantExtensionKeys: ['nu'],
      localeData: RelativeTimeFormat.localeData,
      getDefaultLocale,
    })
  }
  // ECMA-402 §18.3.3 steps 2–5: check the receiver, then coerce value and unit.
  // https://tc39.es/ecma402/#sec-Intl.RelativeTimeFormat.prototype.format
  format(value: number, unit: Intl.RelativeTimeFormatUnit): string {
    const parts = PartitionRelativeTimePattern(
      requireInternalSlots(this),
      +value,
      ToString(unit) as Intl.RelativeTimeFormatUnit
    )
    // ECMA-402 §18.5.4 steps 2–4: concatenate private part values.
    // https://tc39.es/ecma402/#sec-FormatRelativeTime
    let result = ''
    for (let index = 0; index < parts.length; index++) {
      result += parts[index].value
    }
    return result
  }
  // ECMA-402 §18.3.4 steps 2–5.
  // https://tc39.es/ecma402/#sec-Intl.RelativeTimeFormat.prototype.formatToParts
  formatToParts(
    value: number,
    unit: Intl.RelativeTimeFormatUnit
  ): Intl.RelativeTimeFormatPart[] {
    // ECMA-402 §18.5.5: the partitioning path creates fresh parts and array entries.
    // https://tc39.es/ecma402/#sec-FormatRelativeTimeToParts
    return PartitionRelativeTimePattern(
      requireInternalSlots(this),
      +value,
      ToString(unit) as Intl.RelativeTimeFormatUnit
    )
  }

  resolvedOptions(): Intl.ResolvedRelativeTimeFormatOptions {
    // ECMA-402 §18.3.2 steps 2–5: check the receiver, then create own properties.
    // https://tc39.es/ecma402/#sec-intl.relativetimeformat.prototype.resolvedoptions
    const internalSlots = requireInternalSlots(this)
    return {
      locale: internalSlots.locale,
      style: internalSlots.style,
      numeric: internalSlots.numeric,
      numberingSystem: internalSlots.numberingSystem,
    }
  }

  public static supportedLocalesOf(
    locales: string | string[],
    options?: Pick<Intl.RelativeTimeFormatOptions, 'localeMatcher'>
  ): string[] {
    // ECMA-402 §18.2.2: canonicalize before filtering or reading options.
    // https://tc39.es/ecma402/#sec-Intl.RelativeTimeFormat.supportedLocalesOf
    return SupportedLocales(
      RelativeTimeFormat.availableLocales,
      CanonicalizeLocaleList(locales),
      options
    )
  }

  public static __addLocaleData(...data: RelativeTimeLocaleData[]): void {
    for (const {data: d, locale: tag} of data) {
      const locale = canonicalizeLocaleDataTag(tag)
      registerLocaleData(
        locale,
        d,
        RelativeTimeFormat.localeData,
        RelativeTimeFormat.availableLocales
      )
      if (!defaultLocale) {
        defaultLocale = locale
      }
    }
  }
  // ECMA-402 §18.2.3: supported locale data and the nu extension.
  // https://tc39.es/ecma402/#sec-Intl.RelativeTimeFormat-internal-slots
  static localeData: Record<string, LocaleFieldsData> = {}
  private static availableLocales = new Set<string>()
  public static polyfilled = true
}

Object.setPrototypeOf(RelativeTimeFormat.prototype, Object.prototype)

try {
  // ECMA-402 §18.3.5.
  // https://tc39.es/ecma402/#sec-Intl.RelativeTimeFormat.prototype-toStringTag
  if (typeof Symbol !== 'undefined') {
    Object.defineProperty(RelativeTimeFormat.prototype, Symbol.toStringTag, {
      value: 'Intl.RelativeTimeFormat',
      writable: false,
      enumerable: false,
      configurable: true,
    })
  }

  // https://github.com/tc39/test262/blob/master/test/intl402/RelativeTimeFormat/constructor/length.js
  Object.defineProperty(RelativeTimeFormat.prototype.constructor, 'length', {
    value: 0,
    writable: false,
    enumerable: false,
    configurable: true,
  })
  // https://github.com/tc39/test262/blob/master/test/intl402/RelativeTimeFormat/constructor/supportedLocalesOf/length.js
  Object.defineProperty(RelativeTimeFormat.supportedLocalesOf, 'length', {
    value: 1,
    writable: false,
    enumerable: false,
    configurable: true,
  })
} catch {
  // Meta fix so we're test262-compliant, not important
}
