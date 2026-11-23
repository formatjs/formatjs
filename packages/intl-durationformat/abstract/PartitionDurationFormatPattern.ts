import {
  arraySome,
  bigIntFrom,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
import {BigDecimal} from '@formatjs/bigdecimal'
import type {NumberFormatOptions} from '#packages/ecma402-abstract/types/number.js'
import {
  createMemoizedListFormatForConstructor,
  createMemoizedNumberFormatForConstructor,
  getListFormatProvider,
  getFormatterPartsMethod,
  getNumberFormatProvider,
  invariant,
} from '#packages/ecma402-abstract/utils.js'
import {TABLE_2} from '#packages/intl-durationformat/constants.js'
import type {DurationFormat} from '#packages/intl-durationformat/core.js'
import {getInternalSlots} from '#packages/intl-durationformat/get_internal_slots.js'
import {
  type DurationFormatPart,
  type DurationRecord,
} from '#packages/intl-durationformat/types.js'

const apply = Reflect.apply

const stringListIterator = Array.prototype[Symbol.iterator]
const stringListIteratorNext = Object.getPrototypeOf(
  apply(stringListIterator, [], [])
).next

const formatterProviders = new WeakMap<
  DurationFormat,
  {
    numberFormat: ReturnType<typeof createMemoizedNumberFormatForConstructor>
    listFormat: ReturnType<typeof createMemoizedListFormatForConstructor>
    numberFormatToParts: ReturnType<
      ReturnType<typeof createMemoizedNumberFormatForConstructor>
    >['formatToParts']
    listFormatToParts: Intl.ListFormat['formatToParts']
  }
>()
const getFormatterProviders = formatterProviders.get.bind(formatterProviders)
const setFormatterProviders = formatterProviders.set.bind(formatterProviders)

// Capture runtime NumberFormat and ListFormat providers for this instance.
export function initializeDurationFormatProviders(df: DurationFormat): void {
  const NumberFormat = getNumberFormatProvider()
  const ListFormat = getListFormatProvider()
  setFormatterProviders(df, {
    numberFormat: createMemoizedNumberFormatForConstructor(NumberFormat),
    listFormat: createMemoizedListFormatForConstructor(ListFormat),
    numberFormatToParts: getFormatterPartsMethod(NumberFormat),
    listFormatToParts: getFormatterPartsMethod(ListFormat),
  })
}

// ECMA-402 §13.5.15: partition the validated duration into groups of parts.
// https://tc39.es/ecma402/#sec-partitiondurationformatpattern
export function PartitionDurationFormatPattern(
  df: DurationFormat,
  duration: DurationRecord
): DurationFormatPart[] {
  // ECMA-402 §13.5.15: append to private Lists without public Array methods.
  // https://tc39.es/ecma402/#sec-partitiondurationformatpattern
  const result: DurationFormatPart[][] = []
  let done = false
  let separated = false
  let signDisplayed = true
  const negative = arraySome(TABLE_2, row => duration[row.valueField] < 0)
  const internalSlots = getInternalSlots(df)
  const providers = getFormatterProviders(df)!

  for (let i = 0; i < TABLE_2.length && !done; i++) {
    const row = TABLE_2[i]
    // Carry the value as BigDecimal end-to-end so sub-second rollups stay
    // exact. Float arithmetic like `1 + 473/1e3` lands on
    // `1.4729999999999998650`, which `roundingMode: 'trunc'` truncates to
    // `1.472999999` instead of `1.473` (#6462).
    // Duration fields are mathematical integers (ToIntegerIfIntegral, step 3).
    // BigInt preserves the exact Number value beyond the safe-integer range;
    // Number.toString() may instead produce a shorter, rounded decimal.
    // https://tc39.es/ecma402/#sec-tointegerifintegral
    let value = new BigDecimal(bigIntFrom(duration[row.valueField]))
    const style = internalSlots[row.styleSlot]
    const display = internalSlots[row.displaySlot]
    const {unit, numberFormatUnit} = row

    const nfOpts = {__proto__: null} as unknown as NumberFormatOptions
    if (
      unit === 'seconds' ||
      unit === 'milliseconds' ||
      unit === 'microseconds'
    ) {
      let nextStyle
      if (unit === 'seconds') {
        nextStyle = internalSlots.milliseconds
      } else if (unit === 'milliseconds') {
        nextStyle = internalSlots.microseconds
      } else {
        nextStyle = internalSlots.nanoseconds
      }
      // ECMA-402 §13.5.8 checks the next smaller unit.
      // https://tc39.es/ecma402/#sec-nextunitfractional
      if (nextStyle === 'fractional') {
        // ECMA-402 §13.5.7: fold fractional fields at their exact scale.
        // https://tc39.es/ecma402/#sec-computefractionaldigits
        if (unit === 'seconds') {
          value = value
            .plus(
              new BigDecimal(bigIntFrom(duration.milliseconds)).div(
                bigIntFrom(1000)
              )
            )
            .plus(
              new BigDecimal(bigIntFrom(duration.microseconds)).div(
                bigIntFrom(1_000_000)
              )
            )
            .plus(
              new BigDecimal(bigIntFrom(duration.nanoseconds)).div(
                bigIntFrom(1_000_000_000)
              )
            )
        } else if (unit === 'milliseconds') {
          value = value
            .plus(
              new BigDecimal(bigIntFrom(duration.microseconds)).div(
                bigIntFrom(1000)
              )
            )
            .plus(
              new BigDecimal(bigIntFrom(duration.nanoseconds)).div(
                bigIntFrom(1_000_000)
              )
            )
        } else {
          value = value.plus(
            new BigDecimal(bigIntFrom(duration.nanoseconds)).div(
              bigIntFrom(1000)
            )
          )
        }
        if (internalSlots.fractionalDigits === undefined) {
          nfOpts.maximumFractionDigits = 9
          nfOpts.minimumFractionDigits = 0
        } else {
          nfOpts.maximumFractionDigits = internalSlots.fractionalDigits
          nfOpts.minimumFractionDigits = internalSlots.fractionalDigits
        }
        nfOpts.roundingMode = 'trunc'
        done = true
      }
    }
    // ECMA-402 §13.5.12, step 15.a: keep zero minutes between displayed
    // numeric hours and seconds, even when minutesDisplay is auto.
    // https://tc39.es/ecma402/#sec-formatnumericunits
    const minutesBetweenHoursAndSeconds =
      unit === 'minutes' &&
      separated &&
      (internalSlots.secondsDisplay === 'always' ||
        duration.seconds !== 0 ||
        duration.milliseconds !== 0 ||
        duration.microseconds !== 0 ||
        duration.nanoseconds !== 0)
    if (
      !value.isZero() ||
      display !== 'auto' ||
      minutesBetweenHoursAndSeconds
    ) {
      // ECMA-402 §13.5.15 step 4.h.iii.2 and §13.5.12 steps 16–18:
      // display the duration sign once, including on a leading zero unit.
      // https://tc39.es/ecma402/#sec-partitiondurationformatpattern
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/durationformat.html#L868-L882
      if (signDisplayed) {
        if (value.isZero() && negative) value = new BigDecimal('-0')
        signDisplayed = false
      } else {
        nfOpts.signDisplay = 'never'
      }
      nfOpts.numberingSystem = internalSlots.numberingSystem
      // ECMA-402 §13.5.9 step 9 and §13.5.10–11 step 10 disable grouping.
      // https://tc39.es/ecma402/#sec-formatnumerichours
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/durationformat.html#L811
      if (style === 'numeric' || style === '2-digit') nfOpts.useGrouping = false
      // Hours, minutes and seconds share sign, grouping and digit-width options.
      // ECMA-402 §13.5.10 https://tc39.es/ecma402/#sec-formatnumericminutes
      // ECMA-402 §13.5.11 https://tc39.es/ecma402/#sec-formatnumericseconds
      if (style === '2-digit') {
        nfOpts.minimumIntegerDigits = 2
      }
      if (
        style !== '2-digit' &&
        style !== 'numeric' &&
        style !== 'fractional'
      ) {
        nfOpts.style = 'unit'
        nfOpts.unit = numberFormatUnit
        nfOpts.unitDisplay = style
      }
      const nf = providers.numberFormat(
        internalSlots.locale,
        nfOpts as Intl.NumberFormatOptions
      )
      let list: DurationFormatPart[]
      if (!separated) {
        list = []
      } else {
        list = result[result.length - 1]
        setDataProperty(list, `${list.length}`, {
          type: 'literal',
          value:
            unit === 'minutes'
              ? internalSlots.hourMinuteSeparator
              : internalSlots.minuteSecondSeparator,
          // ECMA-402 §§13.5.10–11 give separators an empty internal unit.
          // https://tc39.es/ecma402/#sec-formatnumericminutes
          unit: undefined,
        })
      }
      // Pass the BigDecimal straight through. NumberFormat (V3) parses it
      // as an exact Mathematical Value via ToPrimitive → BigDecimal.toString,
      // which sidesteps the IEEE 754 round-trip that breaks
      // `roundingMode: 'trunc'` on values like `1 + 473/1e3` (#6462).
      // BigDecimal.toString() normalizes -0, so preserve that sign at the boundary.
      let parts = apply(providers.numberFormatToParts, nf, [
        value.isZero() && value.isNegative() ? -0 : value,
      ]) as Intl.NumberFormatPart[]
      for (let index = 0; index < parts.length; index++) {
        const {type, value} = parts[index]
        setDataProperty(list, `${list.length}`, {
          type,
          value,
          unit: numberFormatUnit,
        })
      }
      if (!separated) {
        if (style === '2-digit' || style === 'numeric') {
          separated = true
        }
        setDataProperty(result, `${result.length}`, list)
      }
    } else {
      separated = false
    }
  }
  // ECMA-402 §13.5.14: list-format the group strings, then restore their parts.
  // https://tc39.es/ecma402/#sec-listformatparts
  const lfOpts = {__proto__: null} as unknown as Intl.ListFormatOptions
  lfOpts.type = 'unit'
  let listStyle = internalSlots.style
  if (listStyle === 'digital') {
    listStyle = 'short'
  }
  lfOpts.style = listStyle
  const lf = providers.listFormat(internalSlots.locale, lfOpts)
  const strings: string[] = []
  // ECMA-402 §13.5.15: traverse private part Lists by index.
  // https://tc39.es/ecma402/#sec-partitiondurationformatpattern
  for (let index = 0; index < result.length; index++) {
    const parts = result[index]
    let string = ''
    for (let partIndex = 0; partIndex < parts.length; partIndex++) {
      string += parts[partIndex].value
    }
    setDataProperty(strings, `${strings.length}`, string)
  }
  // ECMA-402 §13.5.15: delegate a private List without public iterator lookup.
  // https://tc39.es/ecma402/#sec-partitiondurationformatpattern
  setDataProperty(strings, Symbol.iterator, () => {
    const iterator = apply(stringListIterator, strings, [])
    return {
      __proto__: null,
      next() {
        return apply(stringListIteratorNext, iterator, [])
      },
    }
  })
  let formatted = apply(providers.listFormatToParts, lf, [
    strings,
  ]) as ReturnType<Intl.ListFormat['formatToParts']>
  let resultIndex = 0
  let resultLength = result.length
  const flattened: DurationFormatPart[] = []
  for (let index = 0; index < formatted.length; index++) {
    const {type, value} = formatted[index]
    if (type === 'element') {
      invariant(resultIndex < resultLength, 'Index out of bounds')
      let parts = result[resultIndex]
      for (let index = 0; index < parts.length; index++) {
        setDataProperty(flattened, `${flattened.length}`, parts[index])
      }
      resultIndex++
    } else {
      invariant(type === 'literal', 'Type must be literal')
      setDataProperty(flattened, `${flattened.length}`, {
        type: 'literal',
        value,
        // ECMA-402 §13.5.14 step 13.b.ii gives list literals an empty unit.
        // https://tc39.es/ecma402/#sec-listformatparts
        unit: undefined,
      })
    }
  }
  return flattened
}
