import {PartitionPattern} from '#packages/ecma402-abstract/PartitionPattern.js'
import {
  type DateTimeFormat,
  type IntlDateTimeFormatPart,
  type IntlDateTimeFormatPartType,
  type IntlDateTimeFormatInternal,
} from '#packages/ecma402-abstract/types/date-time.js'
import {
  HandleDateTimeValue,
  type DateTimeFormattable,
} from '#packages/ecma402-abstract/DateTimeFormat/HandleDateTimeValue.js'
import {
  FormatDateTimePattern,
  type FormatDateTimePatternImplDetails,
} from '#packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.js'
import {type ToLocalTimeImplDetails} from '#packages/ecma402-abstract/DateTimeFormat/ToLocalTime.js'

const patterns = new WeakMap<
  IntlDateTimeFormatInternal,
  {pattern: string; parts: IntlDateTimeFormatPart[]}
>()
const getPattern = patterns.get.bind(patterns)
const setPattern = patterns.set.bind(patterns)

// ECMA-402 §11.5.5 steps 1–3 convert the input. Steps 4–6 select the
// stored format and hour-cycle pattern. Steps 7–8 render its parts.
// https://tc39.es/ecma402/#sec-partitiondatetimepattern
export function PartitionDateTimePattern(
  dtf: Intl.DateTimeFormat | DateTimeFormat,
  x: DateTimeFormattable,
  implDetails: ToLocalTimeImplDetails & FormatDateTimePatternImplDetails
): IntlDateTimeFormatPart[] {
  const record = HandleDateTimeValue(implDetails.getInternalSlots(dtf), x)
  const internalSlots = record.format

  const {pattern} = internalSlots
  let parsed = getPattern(internalSlots)
  if (!parsed || parsed.pattern !== pattern) {
    parsed = {
      pattern,
      parts: PartitionPattern<IntlDateTimeFormatPartType>(pattern),
    }
    setPattern(internalSlots, parsed)
  }
  return FormatDateTimePattern(
    dtf,
    parsed.parts,
    record.epochNanoseconds,
    record.isPlain,
    {...implDetails, getInternalSlots: () => internalSlots}
  )
}
