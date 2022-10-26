import {
  CanonicalizeLocaleList,
  GetOption,
  ToObject,
  setInternalSlot,
  getInternalSlot,
  SameValue,
  ToNumber,
  GetNumberOption,
  ToString,
  SupportedLocales,
  DurationLocaleData,
  DurationPatternLocaleData,
  IsValidUnicodeLanguageTag,
} from '@formatjs/ecma402-abstract'
import {ResolveLocale} from '@formatjs/intl-localematcher'
import {CreatePartsFromList} from '@formatjs/intl-listformat'

interface IntlDurationRecord {
  years: number
  months: number
  weeks: number
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
  microseconds: number
  nanoseconds: number
}

type IntlDuration = Partial<IntlDurationRecord>

interface DurationFormatInternal {
  style: IntlDurationFormatOptions['style']
  locale: string
  numberingSystem: string

  localeData: Record<string, DurationLocaleData>
  dataLocale: string
  fractionalDigits: number

  templatePair: string
  templateStart: string
  templateEnd: string
  templateMiddle: string

  initializedDurationFormat: unknown

  years: number
  yearsDisplay: IntlDurationFormatOptions['yearsDisplay']
  yearsStyle: IntlDurationFormatOptions['years']
  months: number
  monthsDisplay: IntlDurationFormatOptions['monthsDisplay']
  monthsStyle: IntlDurationFormatOptions['months']
  weeks: number
  weeksDisplay: IntlDurationFormatOptions['weeksDisplay']
  weeksStyle: IntlDurationFormatOptions['weeks']
  days: number
  daysDisplay: IntlDurationFormatOptions['daysDisplay']
  daysStyle: IntlDurationFormatOptions['days']
  hours: number
  hoursDisplay: IntlDurationFormatOptions['hoursDisplay']
  hoursStyle: IntlDurationFormatOptions['hours']
  minutes: number
  minutesDisplay: IntlDurationFormatOptions['minutesDisplay']
  minutesStyle: IntlDurationFormatOptions['minutes']
  seconds: number
  secondsDisplay: IntlDurationFormatOptions['secondsDisplay']
  secondsStyle: IntlDurationFormatOptions['seconds']
  milliseconds: number
  millisecondsDisplay: IntlDurationFormatOptions['millisecondsDisplay']
  millisecondsStyle: IntlDurationFormatOptions['milliseconds']
  microseconds: number
  microsecondsDisplay: IntlDurationFormatOptions['microsecondsDisplay']
  microsecondsStyle: IntlDurationFormatOptions['microseconds']
  nanoseconds: number
  nanosecondsDisplay: IntlDurationFormatOptions['nanosecondsDisplay']
  nanosecondsStyle: IntlDurationFormatOptions['nanoseconds']
}

function validateInstance(instance: any, method: string) {
  if (!(instance instanceof DurationFormat)) {
    throw new TypeError(
      `Method Intl.DurationFormat.prototype.${method} called on incompatible receiver ${String(
        instance
      )}`
    )
  }
}

export interface ResolvedIntlDurationFormatOptions {
  /**
   * A string with a BCP 47 language tag, or an array of such strings.
   * For the general form and interpretation of the locales argument,
   * see the [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_identification_and_negotiation) page.
   */
  locale: string

  style: IntlDurationFormatOptions['style']

  numberingSystem: string
  fractionalDigits: number

  yearsDisplay: IntlDurationFormatOptions['yearsDisplay']
  years: IntlDurationFormatOptions['years']

  monthsDisplay: IntlDurationFormatOptions['monthsDisplay']
  months: IntlDurationFormatOptions['months']

  weeksDisplay: IntlDurationFormatOptions['weeksDisplay']
  weeks: IntlDurationFormatOptions['weeks']

  daysDisplay: IntlDurationFormatOptions['daysDisplay']
  days: IntlDurationFormatOptions['days']

  hoursDisplay: IntlDurationFormatOptions['hoursDisplay']
  hours: IntlDurationFormatOptions['hours']

  minutesDisplay: IntlDurationFormatOptions['minutesDisplay']
  minutes: IntlDurationFormatOptions['minutes']

  secondsDisplay: IntlDurationFormatOptions['secondsDisplay']
  seconds: IntlDurationFormatOptions['seconds']

  millisecondsDisplay: IntlDurationFormatOptions['millisecondsDisplay']
  milliseconds: IntlDurationFormatOptions['milliseconds']

  microsecondsDisplay: IntlDurationFormatOptions['microsecondsDisplay']
  microseconds: IntlDurationFormatOptions['microseconds']

  nanosecondsDisplay: IntlDurationFormatOptions['nanosecondsDisplay']
  nanoseconds: IntlDurationFormatOptions['nanoseconds']
}

let table1 = [
  // Value Slot 	Style Slot 	Display Slot 	Unit 	NumberFormat Unit 	Values 	Digital Default
  {
    slot: 'years',
    styleSlot: 'yearsStyle',
    displaySlot: 'yearsDisplay',
    unit: 'years',
    numberFormat: 'year',
    values: ['long', 'short', 'narrow'],
    digitalDefault: 'short',
  },
  {
    slot: 'months',
    styleSlot: 'monthsStyle',
    displaySlot: 'monthsDisplay',
    unit: 'months',
    numberFormat: 'month',
    values: ['long', 'short', 'narrow'],
    digitalDefault: 'short',
  },
  {
    slot: 'weeks',
    styleSlot: 'weeksStyle',
    displaySlot: 'weeksDisplay',
    unit: 'weeks',
    numberFormat: 'week',
    values: ['long', 'short', 'narrow'],
    digitalDefault: 'short',
  },
  {
    slot: 'days',
    styleSlot: 'daysStyle',
    displaySlot: 'daysDisplay',
    unit: 'days',
    numberFormat: 'day',
    values: ['long', 'short', 'narrow'],
    digitalDefault: 'short',
  },
  {
    slot: 'hours',
    styleSlot: 'hoursStyle',
    displaySlot: 'hoursDisplay',
    unit: 'hours',
    numberFormat: 'hour',
    values: ['long', 'short', 'narrow', 'numeric', '2-digit'],
    digitalDefault: 'numeric',
  },
  {
    slot: 'minutes',
    styleSlot: 'minutesStyle',
    displaySlot: 'minutesDisplay',
    unit: 'minutes',
    numberFormat: 'minute',
    values: ['long', 'short', 'narrow', 'numeric', '2-digit'],
    digitalDefault: 'numeric',
  },
  {
    slot: 'seconds',
    styleSlot: 'secondsStyle',
    displaySlot: 'secondsDisplay',
    unit: 'seconds',
    numberFormat: 'second',
    values: ['long', 'short', 'narrow', 'numeric', '2-digit'],
    digitalDefault: 'numeric',
  },
  {
    slot: 'milliseconds',
    styleSlot: 'millisecondsStyle',
    displaySlot: 'millisecondsDisplay',
    unit: 'milliseconds',
    numberFormat: 'millisecond',
    values: ['long', 'short', 'narrow', 'numeric'],
    digitalDefault: 'numeric',
  },
  {
    slot: 'microseconds',
    styleSlot: 'microsecondsStyle',
    displaySlot: 'microsecondsDisplay',
    unit: 'microseconds',
    numberFormat: 'microsecond',
    values: ['long', 'short', 'narrow', 'numeric'],
    digitalDefault: 'numeric',
  },
  {
    slot: 'nanoseconds',
    styleSlot: 'nanosecondsStyle',
    displaySlot: 'nanosecondsDisplay',
    unit: 'nanoseconds',
    numberFormat: 'nanosecond',
    values: ['long', 'short', 'narrow', 'numeric'],
    digitalDefault: 'numeric',
  },
] as const

export interface IntlDurationFormatOptions {
  style: 'long' | 'short' | 'narrow' | 'digital'
  localeMatcher: 'best fit' | 'lookup'
  numberingSystem: string
  fractionalDigits: number
  yearsDisplay: 'always' | 'auto'
  years: 'long' | 'short' | 'narrow'
  monthsDisplay: 'always' | 'auto'
  months: 'long' | 'short' | 'narrow'
  weeksDisplay: 'always' | 'auto'
  weeks: 'long' | 'short' | 'narrow'
  daysDisplay: 'always' | 'auto'
  days: 'long' | 'short' | 'narrow'
  hoursDisplay: 'always' | 'auto'
  hours: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit'
  minutesDisplay: 'always' | 'auto'
  minutes: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit'
  secondsDisplay: 'always' | 'auto'
  seconds: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit'
  millisecondsDisplay: 'always' | 'auto'
  milliseconds: 'long' | 'short' | 'narrow' | 'numeric'
  microsecondsDisplay: 'always' | 'auto'
  microseconds: 'long' | 'short' | 'narrow' | 'numeric'
  nanosecondsDisplay: 'always' | 'auto'
  nanoseconds: 'long' | 'short' | 'narrow' | 'numeric'
}

type Table1 = typeof table1
type Unit = Table1[number]['unit']
type Style = 'long' | 'short' | 'digital' | 'narrow'
type UnitStyle = 'long' | 'short' | 'narrow' | 'numeric' | '2-digit'
function GetDurationUnitOptions(
  unit: Unit,
  options: Partial<IntlDurationFormatOptions> | undefined = {},
  baseStyle: Style,
  stylesList: readonly (UnitStyle | undefined)[],
  digitalBase: UnitStyle,
  prevStyle?: UnitStyle
): {style: UnitStyle; display: 'auto' | 'always'} {
  // Let style be ? GetOption(options, unit, "string", stylesList, undefined).
  let style = GetOption(options, unit, 'string', [...stylesList], undefined)
  // 2. Let displayDefault be "always".
  let displayDefault: 'always' | 'auto' = 'always'
  // 3. If style is undefined, then
  if (style === undefined) {
    // a. If baseStyle is "digital", then
    if (baseStyle === 'digital') {
      // i. If unit is not one of "hours", "minutes", or "seconds", then
      if (['hours', 'minutes', 'seconds'].indexOf(unit) === -1) {
        // 1. Set displayDefault to "auto".
        displayDefault = 'auto'
      }
      // ii. Set style to digitalBase.
      style = digitalBase
    } else {
      // b. Else,
      // i. Set displayDefault to "auto".
      displayDefault = 'auto'
      // ii. If prevStyle is "numeric" or "2-digit", then
      // 1. Set style to "numeric".
      if (prevStyle === 'numeric' || prevStyle === '2-digit') style = 'numeric'
      // iii. Else,
      // 1. Set style to baseStyle.
      else style = baseStyle
    }
  }
  // 4. Let displayField be the string-concatenation of unit and "Display".
  let displayField = `${unit}Display` as const
  // 5. Let display be ? GetOption(options, displayField, "string", « "auto", "always" », displayDefault).
  let display = GetOption(
    options,
    displayField,
    'string',
    ['auto', 'always'],
    displayDefault
  )
  // 6. If prevStyle is "numeric" or "2-digit", then
  if (prevStyle === 'numeric' || prevStyle === '2-digit') {
    // a. If style is not "numeric" or "2-digit", then
    if (style !== 'numeric' && style !== '2-digit') {
      // i. Throw a RangeError exception.
      throw new RangeError()
    }
    // b. Else if unit is "minutes" or "seconds", then
    if (unit === 'minutes' || unit === 'seconds') {
      // i. Set style to "2-digit".
      style = '2-digit'
    }
  }
  // 7. Return the Record { [[Style]]: style, [[Display]]: display }.
  return {style, display}
}

/**
 * https://tc39.es/proposal-intl-duration-format/#sec-tointegerwithoutrounding
 * @param n
 */
export function ToIntegerWithoutRounding(n: any): number {
  const number = ToNumber(n)
  if (isNaN(number) || SameValue(number, -0)) {
    return 0
  }
  if (isFinite(number)) {
    return number
  }
  if (!Number.isInteger(number)) {
    throw new RangeError()
  }

  return number
}

function ToDurationRecord(input: IntlDuration): IntlDurationRecord {
  // If Type(input) is not Object, throw a TypeError exception.
  if (typeof input !== 'object') throw new TypeError()
  // 2. Let result be a new Duration Record with each field set to 0.
  let result: IntlDurationRecord = {
    years: 0,
    months: 0,
    weeks: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
    microseconds: 0,
    nanoseconds: 0,
  }
  // 3. Let any be false.
  let any = false
  // 4. For each row of Table 1, except the header row, in table order, do
  for (const row of table1) {
    // a. Let valueSlot be the Value Slot value of the current row.
    let valueSlot = row.unit
    // b. Let unit be the Unit value of the current row.
    let unit = row.unit
    // c. Let value be ? Get(input, unit).
    let value = input[unit]
    // d. If value is not undefined, then
    if (value !== undefined) {
      // i. Set any to true.
      any = true
      // ii. Set value to ? ToIntegerWithoutRounding(value).
      value = ToIntegerWithoutRounding(value)
      // iii. Set result.[[<valueSlot>]] to value.
      result[valueSlot] = value
    }
  }

  // 5. If any is false, throw a TypeError exception.
  if (!any) throw new TypeError()

  // 6. Return result.
  return result
}

function DurationRecordSign(record: IntlDurationRecord): number {
  // 1. For each row of Table 1, except the header row, in table order, do
  for (const row of table1) {
    // a. Let valueSlot be the Value Slot value of the current row.
    let valueSlot = row.unit
    // b. Let v be record.[[<valueSlot>]].
    let v = record[valueSlot]
    // c. If v < 0, return -1.
    if (v < 0) return -1
    // d. If v > 0, return 1.
    if (v > 0) return 1
  }

  // 2. Return 0.
  return 0
}

function IsValidDurationRecord(record: IntlDurationRecord) {
  // The abstract operation IsValidDurationRecord takes argument record (a Duration Record). It returns true if record represents a valid duration, and false otherwise. It performs the following steps when called:

  // 1. Let sign be ! DurationRecordSign(record).
  let sign = DurationRecordSign(record)
  // 2. For each row of Table 1, except the header row, in table order, do
  for (const row of table1) {
    // a. Let valueSlot be the Value Slot value of the current row.
    let valueSlot = row.unit
    // b. Let v be record.[[<valueSlot>]].
    let v = record[valueSlot]
    // c. Assert: 𝔽(v) is finite.
    // d. If v < 0 and sign > 0, return false.
    if (v < 0 && sign > 0) return false
    // e. If v > 0 and sign < 0, return false.
    if (v > 0 && sign < 0) return false
  }

  // 3. Return true.
  return true
}

function PartitionDurationFormatPattern(
  internalSlotMap: WeakMap<DurationFormat, DurationFormatInternal>,
  durationFormat: DurationFormat,
  duration: IntlDurationRecord
) {
  // 1. Let result be a new empty List.
  let result = [] as {type: string; value: string}[]
  // 2. Let done be false.
  // let done = false
  // 3. While done is false, repeat for each row in Table 1 in order, except the header row:
  // while (!done) {
  for (const row of table1) {
    // a. Let styleSlot be the Style Slot value.
    let styleSlot = row.styleSlot
    // b. Let displaySlot be the Display Slot value.
    let displaySlot = row.displaySlot
    // c. Let valueSlot be the Value Slot value.
    let valueSlot = row.unit
    // d. Let unit be the Unit value.
    let unit = row.unit
    // e. Let numberFormatUnit be the NumberFormat Unit value.
    let numberFormatUnit = row.numberFormat
    // f. Let style be durationFormat.[[<styleSlot>]].
    let style = getInternalSlot(internalSlotMap, durationFormat, styleSlot)
    // g. Let display be durationFormat.[[<displaySlot>]].
    let display = getInternalSlot(internalSlotMap, durationFormat, displaySlot)
    // h. Let value be duration.[[<valueSlot>]].
    let value = duration[valueSlot]
    // i. Let nfOpts be ! OrdinaryObjectCreate(null).
    let nfOpts = Object.create(null)
    let nextStyle: UnitStyle
    // j. If unit is "seconds", "milliseconds", or "microseconds", then
    if (['seconds', 'milliseconds', 'microseconds'].indexOf(unit) !== -1) {
      // i. If unit is "seconds", then
      if (unit === 'seconds') {
        // 1. Let nextStyle be durationFormat.[[MillisecondsStyle]].
        nextStyle = getInternalSlot(
          internalSlotMap,
          durationFormat,
          'millisecondsStyle'
        )
        // ii. Else if unit is "milliseconds", then
      } else if (unit === 'milliseconds') {
        // 1. Let nextStyle be durationFormat.[[MicrosecondsStyle]].
        nextStyle = getInternalSlot(
          internalSlotMap,
          durationFormat,
          'microsecondsStyle'
        )
        // iii. Else,
      } else {
        // 1. Let nextStyle be durationFormat.[[NanosecondsStyle]].
        nextStyle = getInternalSlot(
          internalSlotMap,
          durationFormat,
          'nanosecondsStyle'
        )
      }

      // iv. If nextStyle is "numeric", then
      if (nextStyle === 'numeric') {
        // 1. If unit is "seconds", then
        if (unit === 'seconds') {
          // a. Set value to value + duration.[[Milliseconds]] / 103 + duration.[[Microseconds]] / 106 + duration.[[Nanoseconds]] / 109.
          value +=
            duration.milliseconds / 103 +
            duration.microseconds / 106 +
            duration.nanoseconds / 109
          // 2. Else if unit is "milliseconds", then
        } else if (unit === 'milliseconds') {
          // a. Set value to value + duration.[[Microseconds]] / 103 + duration.[[Nanoseconds]] / 106.
          value += duration.microseconds / 103 + duration.nanoseconds / 106
          // 3. Else,
        } else {
          // a. Set value to value + duration.[[Nanoseconds]] / 103.
          value += value + duration.nanoseconds / 103
        }
        // 4. Perform ! CreateDataPropertyOrThrow(nfOpts, "maximumFractionDigits", durationFormat.[[FractionalDigits]]).
        nfOpts['maximumFractionDigits'] = getInternalSlot(
          internalSlotMap,
          durationFormat,
          'fractionalDigits'
        )
        // 5. Perform ! CreateDataPropertyOrThrow(nfOpts, "minimumFractionDigits", durationFormat.[[FractionalDigits]]).
        nfOpts['minimumFractionDigits'] = getInternalSlot(
          internalSlotMap,
          durationFormat,
          'fractionalDigits'
        )

        // 6. Set done to true.
        // done = true
        break
      }
    }
    // k. If style is "2-digit", then
    if (style === '2-digit') {
      // i. Perform ! CreateDataPropertyOrThrow(nfOpts, "minimumIntegerDigits", 2𝔽).
      nfOpts['minimumIntegerDigits'] = 2
    }
    // l. If value is not 0 or display is not "auto", then
    if (value !== 0 || display !== 'auto') {
      // i. If style is "2-digit" or "numeric", then
      if (style === '2-digit' || style === 'numeric') {
        // 1. Let nf be ! Construct(%NumberFormat%, « durationFormat.[[Locale]], nfOpts »).
        let l = getInternalSlot(internalSlotMap, durationFormat, 'locale')

        let nf = new Intl.NumberFormat(l, nfOpts)
        // 2. Let dataLocale be durationFormat.[[DataLocale]].
        let dataLocale = getInternalSlot(
          internalSlotMap,
          durationFormat,
          'dataLocale'
        )
        // 3. Let dataLocaleData be %DurationFormat%.[[LocaleData]].[[<dataLocale>]].
        let dataLocaleData = getInternalSlot(
          internalSlotMap,
          durationFormat,
          'localeData'
        )[dataLocale]
        // 4. Let num be ! FormatNumeric(nf, 𝔽(value)).
        let num = nf.format(value)
        // 5. Append the new Record { [[Type]]: unit, [[Value]]: num} to the end of result.
        result.push({type: unit, value: num})
        // 6. If unit is "hours" or "minutes", then
        if (unit === 'hours' || unit === 'minutes') {
          let nextValue: number
          let nextDisplay: 'always' | 'auto'

          // a. If unit is "hours", then
          if (unit === 'hours') {
            // i. Let nextValue be duration.[[Minutes]].
            nextValue = duration.minutes
            // ii. Let nextDisplay be durationFormat.[[MinutesDisplay]].
            nextDisplay = getInternalSlot(
              internalSlotMap,
              durationFormat,
              'minutesDisplay'
            )
          } else {
            // b. Else,
            // i. Let nextValue be duration.[[Seconds]].
            nextValue = duration.seconds
            // ii. Let nextDisplay be durationFormat.[[SecondsDisplay]].
            nextDisplay = getInternalSlot(
              internalSlotMap,
              durationFormat,
              'minutesDisplay'
            )
            // iii. If durationFormat.[[MillisecondsStyle]] is "numeric", then
            if (
              getInternalSlot(
                internalSlotMap,
                durationFormat,
                'millisecondsStyle'
              ) === 'numeric'
            ) {
              // i. Set nextValue to nextValue + duration.[[Milliseconds]] / 103 + duration.[[Microseconds]] / 106 + duration.[[Nanoseconds]] / 109.
              nextValue +=
                duration.milliseconds / 103 +
                duration.microseconds / 106 +
                duration.nanoseconds / 109
            }
          }

          // c. If nextValue is not 0 or nextDisplay is not "auto", then
          if (nextValue !== 0 || nextDisplay !== 'auto') {
            // i. Let separator be dataLocaleData.[[digitalFormat]].[[separator]].
            let separator = dataLocaleData.digitalFormat.separator
            // ii. Append the new Record { [[Type]]: "literal", [[Value]]: separator} to the end of result.
            result.push({type: 'literal', value: separator})
          }
        }
      } else {
        // For now, don't format nanosecond and microsecond as NumberFormat doesn't
        // accept them...
        //
        // See https://github.com/tc39/ecma402/issues/702
        // If we don't modify intl-numberformat...
        // if (
        //   numberFormatUnit === 'nanosecond' ||
        //   numberFormatUnit === 'microsecond'
        // ) {
        //   result.push({type: unit, value: `${value} ${numberFormatUnit}`})
        //   continue
        // }

        // ii. Else,
        // 1. Perform ! CreateDataPropertyOrThrow(nfOpts, "style", "unit").
        nfOpts.style = 'unit'
        // 2. Perform ! CreateDataPropertyOrThrow(nfOpts, "unit", numberFormatUnit).
        nfOpts.unit = numberFormatUnit

        // 3. Perform ! CreateDataPropertyOrThrow(nfOpts, "unitDisplay", style).
        nfOpts.unitDisplay = style

        // 4. Let nf be ! Construct(%NumberFormat%, « durationFormat.[[Locale]], nfOpts »).
        let l = getInternalSlot(internalSlotMap, durationFormat, 'locale')

        let nf = new Intl.NumberFormat(l, nfOpts)
        // 5. Let parts be ! PartitionNumberPattern(nf, 𝔽(value)).
        let parts = nf.formatToParts(value)
        // 6. Let concat be an empty String.
        let concat = ''
        // 7. For each Record { [[Type]], [[Value]], [[Unit]] } part in parts, do
        for (const part of parts) {
          // a. Set concat to the string-concatenation of concat and part.[[Value]].
          concat += part.value
        }
        // 8. Append the new Record { [[Type]]: unit, [[Value]]: concat } to the end of result.
        result.push({type: unit, value: concat})
      }
    }
  }
  // }

  // 4. Let lfOpts be ! OrdinaryObjectCreate(null).
  let lfOpts = Object.create(null)
  // 5. Perform ! CreateDataPropertyOrThrow(lfOpts, "type", "unit").
  lfOpts['type'] = 'unit'
  // 6. Let listStyle be durationFormat.[[Style]].
  let listStyle = getInternalSlot(internalSlotMap, durationFormat, 'style')
  // 7. If listStyle is "digital", then
  if (listStyle === 'digital') {
    // a. Set listStyle to "narrow".
    listStyle = 'narrow'
  }
  // 8. Perform ! CreateDataPropertyOrThrow(lfOpts, "style", listStyle).
  lfOpts['style'] = listStyle
  // 9. Let lf be ! Construct(%ListFormat%, « durationFormat.[[Locale]], lfOpts »).
  let lf = new Intl.ListFormat(
    getInternalSlot(internalSlotMap, durationFormat, 'locale'),
    lfOpts
  )
  // 10. Set result to ! CreatePartsFromList(lf, result).
  return CreatePartsFromList(lf, result)
}

export class DurationFormat {
  constructor(
    locales?: string | string[],
    options: Partial<IntlDurationFormatOptions> = {}
  ) {
    // test262/test/intl402/DurationFormat/constructor/constructor/newtarget-undefined.js
    // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
    const newTarget =
      this && this instanceof DurationFormat ? this.constructor : void 0
    if (!newTarget) {
      throw new TypeError("Intl.DurationFormat must be called with 'new'")
    }
    const requestedLocales = CanonicalizeLocaleList(locales)

    const opts = options === undefined ? Object.create(null) : ToObject(options)
    const matcher = GetOption(
      opts,
      'localeMatcher',
      'string',
      ['best fit', 'lookup'],
      'best fit'
    )

    // 6. Let numberingSystem be ? GetOption(options, "numberingSystem", "string", undefined, undefined).
    // 7. If numberingSystem is not undefined, then
    const numberingSystem = GetOption(
      opts,
      'numberingSystem',
      'string',
      undefined,
      undefined
    )

    //   a. If numberingSystem does not match the Unicode Locale Identifier type nonterminal, throw a RangeError exception.
    if (
      numberingSystem !== undefined &&
      !IsValidUnicodeLanguageTag(numberingSystem)
    ) {
      throw new RangeError('Invalid numberingSystem')
    }

    // 8. Let opt be the Record { [[localeMatcher]]: matcher, [[nu]]: numberingSystem }.
    const opt: any = Object.create(null)
    opt.localeMatcher = matcher
    opt.nu = numberingSystem

    const {localeData} = DurationFormat

    // 9. Let r be ResolveLocale(%DurationFormat%.[[AvailableLocales]], requestedLocales, opt, %DurationFormat%.[[RelevantExtensionKeys]], %DurationFormat%.[[LocaleData]]).
    const r = ResolveLocale(
      DurationFormat.availableLocales,
      requestedLocales,
      opt,
      // [[RelevantExtensionKeys]] slot, which is a constant
      ['nu'],
      localeData,
      DurationFormat.getDefaultLocale
    )
    // 10. Let locale be r.[[locale]].
    let locale = r.locale

    // 11. Set durationFormat.[[Locale]] to locale.
    setInternalSlot(
      DurationFormat.__INTERNAL_SLOT_MAP__,
      this,
      'locale',
      locale
    )
    // 12. Set durationFormat.[[NumberingSystem]] to r.[[nu]].
    setInternalSlot(
      DurationFormat.__INTERNAL_SLOT_MAP__,
      this,
      'numberingSystem',
      r.nu
    )
    // 13. Let style be ? GetOption(options, "style", "string", « "long", "short", "narrow", "digital" », "short").
    let style = GetOption(
      options,
      'style',
      'string',
      ['long', 'short', 'narrow', 'digital'],
      'short'
    )
    // 14. Set durationFormat.[[Style]] to style.
    setInternalSlot(DurationFormat.__INTERNAL_SLOT_MAP__, this, 'style', style)
    // 15. Set durationFormat.[[DataLocale]] to r.[[dataLocale]].
    setInternalSlot(
      DurationFormat.__INTERNAL_SLOT_MAP__,
      this,
      'dataLocale',
      r.dataLocale
    )
    // 16. Let prevStyle be the empty String.
    let prevStyle: UnitStyle | '' = ''

    for (const row of table1) {
      // For each row of Table 1, except the header row, in table order, do

      // a. Let styleSlot be the Style Slot value of the current row.
      let styleSlot = row.styleSlot
      // b. Let displaySlot be the Display Slot value of the current row.
      let displaySlot = row.displaySlot
      // c. Let unit be the Unit value.
      let unit = row.unit
      // d. Let valueList be the Values value.
      let valueList = row.values
      // e. Let digitalBase be the Digital Default value.
      let digitalBase = row.digitalDefault
      // f. Let unitOptions be ? GetDurationUnitOptions(unit, options, style, valueList, digitalBase, prevStyle).
      let unitOptions = GetDurationUnitOptions(
        unit,
        options,
        style,
        valueList,
        digitalBase,
        prevStyle || undefined
      )
      // g. Set the value of the styleSlot slot of durationFormat to unitOptions.[[Style]].
      setInternalSlot(
        DurationFormat.__INTERNAL_SLOT_MAP__,
        this,
        styleSlot,
        unitOptions.style
      )
      // h. Set the value of the displaySlot slot of durationFormat to unitOptions.[[Display]].
      setInternalSlot(
        DurationFormat.__INTERNAL_SLOT_MAP__,
        this,
        displaySlot,
        unitOptions.display
      )
      // i. If unit is one of "hours", "minutes", "seconds", "milliseconds", or "microseconds", then
      // i. Set prevStyle to unitOptions.[[Style]].
      if (
        ['hours', 'minutes', 'seconds', 'milliseconds', 'microseconds'].indexOf(
          unitOptions.style
        ) !== -1
      ) {
        prevStyle = unitOptions.style
      }
    }

    // 18. Set durationFormat.[[FractionalDigits]] to ? GetNumberOption(options, "fractionalDigits", 0, 9, 0).
    setInternalSlot(
      DurationFormat.__INTERNAL_SLOT_MAP__,
      this,
      'fractionalDigits',
      GetNumberOption(options, 'fractionalDigits', 0, 9, 0)
    )
  }

  format(duration: IntlDuration) {
    // When the format method is called with an argument duration, the following steps are taken:

    // 1. Let df be this value.
    let df = this
    // 2. Perform ? RequireInternalSlot(df, [[InitializedDurationFormat]]).
    getInternalSlot(
      DurationFormat.__INTERNAL_SLOT_MAP__,
      df,
      'initializedDurationFormat'
    )
    // 3. Let record be ? ToDurationRecord(duration).
    let record = ToDurationRecord(duration)
    // 4. If IsValidDurationRecord(record) is false, throw a RangeError exception.
    if (!IsValidDurationRecord(record)) throw new RangeError()
    // 5. Let parts be ! PartitionDurationFormatPattern(df, record).
    let parts = PartitionDurationFormatPattern(
      DurationFormat.__INTERNAL_SLOT_MAP__,
      df,
      record
    )
    // 6. Let result be a new empty String.
    let result = ''
    // 7. For each Record { [[Type]], [[Value]] } part in parts, do
    // a. Set result to the string-concatenation of result and part.[[Value]].
    for (const part of parts) {
      result += part.value
    }
    // 8. Return result.
    return result
  }
  formatToParts(duration: IntlDuration) {
    // 1. Let df be this value.
    let df = this
    // 2. Perform ? RequireInternalSlot(df, [[InitializedDurationFormat]]).
    getInternalSlot(
      DurationFormat.__INTERNAL_SLOT_MAP__,
      df,
      'initializedDurationFormat'
    )
    // 3. Let record be ? ToDurationRecord(duration).
    let record = ToDurationRecord(duration)
    // 4. If IsValidDurationRecord(record) is false, throw a RangeError exception.
    if (!IsValidDurationRecord(record)) throw new RangeError()
    // 5. Let parts be ! PartitionDurationFormatPattern(df, record).
    let parts = PartitionDurationFormatPattern(
      DurationFormat.__INTERNAL_SLOT_MAP__,
      df,
      record
    )
    // 6. Let result be ! ArrayCreate(0).
    let result = [] as {type: string; value: string}[]
    // 7. Let n be 0.
    let n = 0
    // 8. For each { [[Type]], [[Value]] } part in parts, do
    for (const part of parts) {
      // a. Let obj be ! OrdinaryObjectCreate(%ObjectPrototype%).
      let obj = Object.create(null) as {type: string; value: string}
      // b. Perform ! CreateDataPropertyOrThrow(obj, "type", part.[[Type]]).
      obj['type'] = part.type
      // c. Perform ! CreateDataPropertyOrThrow(obj, "value", part.[[Value]]).
      obj['value'] = part.value
      // d. Perform ! CreateDataPropertyOrThrow(result, ! ToString(n), obj).
      result[ToString(n) as unknown as number] = obj
      // e. Increment n by 1.
      n++
    }
    // 9. Return result.
    return result
  }

  resolvedOptions(): ResolvedIntlDurationFormatOptions {
    const table2 = {
      locale: 'locale',
      style: 'style',
      years: 'yearsStyle',
      yearsDisplay: 'yearsDisplay',
      months: 'monthsStyle',
      monthsDisplay: 'monthsDisplay',
      weeks: 'weeksStyle',
      weeksDisplay: 'weeksDisplay',
      days: 'daysStyle',
      daysDisplay: 'daysDisplay',
      hours: 'hoursStyle',
      hoursDisplay: 'hoursDisplay',
      minutes: 'minutesStyle',
      minutesDisplay: 'minutesDisplay',
      seconds: 'secondsStyle',
      secondsDisplay: 'secondsDisplay',
      milliseconds: 'millisecondsStyle',
      millisecondsDisplay: 'millisecondsDisplay',
      microseconds: 'microsecondsStyle',
      microsecondsDisplay: 'microsecondsDisplay',
      nanoseconds: 'nanosecondsStyle',
      nanosecondsDisplay: 'nanosecondsDisplay',
      fractionalDigits: 'fractionalDigits',
      numberingSystem: 'numberingSystem',
    } as const
    validateInstance(this, 'resolvedOptions')
    const entries = (
      Object.keys(table2) as (keyof ResolvedIntlDurationFormatOptions)[]
    ).reduce(
      (prev, nextKey) => {
        ;(
          prev as Record<
            keyof ResolvedIntlDurationFormatOptions,
            string | number
          >
        )[nextKey] = getInternalSlot(
          DurationFormat.__INTERNAL_SLOT_MAP__,
          this,
          table2[nextKey]
        )

        return prev
      },
      {} as {
        [k in keyof ResolvedIntlDurationFormatOptions]: DurationFormatInternal[typeof table2[k]]
      }
    )
    return entries
  }

  public static supportedLocalesOf(
    locales: string | string[],
    options?: Pick<IntlDurationFormatOptions, 'localeMatcher'>
  ) {
    return SupportedLocales(
      DurationFormat.availableLocales,
      CanonicalizeLocaleList(locales),
      options
    )
  }

  public static __addLocaleData(...data: DurationPatternLocaleData[]) {
    for (const {data: d, locale} of data) {
      const minimizedLocale = new (Intl as any).Locale(locale)
        .minimize()
        .toString()
      DurationFormat.localeData[locale] = DurationFormat.localeData[
        minimizedLocale
      ] = d
      DurationFormat.availableLocales.add(minimizedLocale)
      DurationFormat.availableLocales.add(locale)
      if (!DurationFormat.__defaultLocale) {
        DurationFormat.__defaultLocale = minimizedLocale
      }
    }
  }
  static localeData: Record<string, DurationLocaleData | undefined> = {}
  private static availableLocales = new Set<string>()
  static __defaultLocale: string
  static getDefaultLocale() {
    return DurationFormat.__defaultLocale
  }
  private static readonly __INTERNAL_SLOT_MAP__ = new WeakMap<
    DurationFormat,
    DurationFormatInternal
  >()
}

try {
  // IE11 does not have Symbol
  if (typeof Symbol !== 'undefined') {
    Object.defineProperty(DurationFormat.prototype, Symbol.toStringTag, {
      value: 'Intl.DurationFormat',
      writable: false,
      enumerable: false,
      configurable: true,
    })
  }

  // https://github.com/tc39/test262/blob/master/test/intl402/DurationFormat/constructor/length.js
  Object.defineProperty(DurationFormat.prototype.constructor, 'length', {
    value: 0,
    writable: false,
    enumerable: false,
    configurable: true,
  })
  // https://github.com/tc39/test262/blob/master/test/intl402/DurationFormat/constructor/supportedLocalesOf/length.js
  Object.defineProperty(DurationFormat.supportedLocalesOf, 'length', {
    value: 1,
    writable: false,
    enumerable: false,
    configurable: true,
  })
} catch (e) {}

export default DurationFormat
