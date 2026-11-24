import {FormatNumeric} from '#packages/ecma402-abstract/NumberFormat/FormatNumeric.js'
import {ToIntlMathematicalValue} from '#packages/ecma402-abstract/ToIntlMathematicalValue.js'
import {type NumberFormatOptions} from '#packages/ecma402-abstract/types/number.js'
import {defineProperty} from '#packages/ecma402-abstract/utils.js'
// eslint-disable-next-line import/no-cycle
import {NumberFormat} from '#packages/intl-numberformat/core.js'
import getInternalSlots from '#packages/intl-numberformat/get_internal_slots.js'

const reflectApply = Reflect.apply
const numberValueOf = Number.prototype.valueOf
const bigIntPrototype =
  typeof BigInt === 'undefined' ? undefined : BigInt.prototype
const bigIntValueOf = bigIntPrototype?.valueOf

export function toLocaleString(
  x: number | bigint,
  locales?: string | string[],
  options?: NumberFormatOptions
): string {
  const formatter = new NumberFormat(locales, options)
  return FormatNumeric(getInternalSlots(formatter), ToIntlMathematicalValue(x))
}

const numberMethods = {
  // ECMA-402 §20.2.1 steps 1–3 read the Number value before options.
  // https://tc39.es/ecma402/#sup-number.prototype.tolocalestring
  toLocaleString(
    this: unknown,
    locales: string | string[] | undefined = undefined,
    options?: NumberFormatOptions
  ) {
    return toLocaleString(
      reflectApply(numberValueOf, this, []),
      locales,
      options
    )
  },
}

const bigIntMethods = {
  // ECMA-402 §20.3.1 steps 1–3 read the BigInt value before options.
  // https://tc39.es/ecma402/#sup-bigint.prototype.tolocalestring
  toLocaleString(
    this: unknown,
    locales: string | string[] | undefined = undefined,
    options?: NumberFormatOptions
  ) {
    return toLocaleString(
      reflectApply(bigIntValueOf!, this, []),
      locales,
      options
    )
  },
}

export function installNumberLocaleMethods(): void {
  defineProperty(Number.prototype, 'toLocaleString', {
    value: numberMethods.toLocaleString,
  })
  if (bigIntPrototype) {
    defineProperty(bigIntPrototype, 'toLocaleString', {
      value: bigIntMethods.toLocaleString,
    })
  }
}
