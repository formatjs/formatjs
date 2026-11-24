import {
  numberIsFinite,
  RangeErrorConstructor,
} from '#packages/ecma262-abstract/intrinsics.js'
import {SameValue} from '#packages/ecma262-abstract/SameValue.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {
  type FieldData,
  type RelativeTimeField,
  type RelativeTimeFormatInternal,
} from '#packages/ecma402-abstract/types/relative-time.js'
import {SingularRelativeTimeUnit} from '#packages/ecma402-abstract/RelativeTimeFormat/SingularRelativeTimeUnit.js'
import {MakePartsList} from '#packages/ecma402-abstract/RelativeTimeFormat/MakePartsList.js'

const hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty)
const abs = Math.abs

// ECMA-402 §18.5.2: validate value and unit, then select the locale pattern.
// https://tc39.es/ecma402/#sec-PartitionRelativeTimePattern
export function PartitionRelativeTimePattern(
  {
    fields,
    style,
    numeric,
    selectPlural,
    formatNumber,
  }: RelativeTimeFormatInternal,
  value: number,
  unit: Intl.RelativeTimeFormatUnit
): Intl.RelativeTimeFormatPart[] {
  if (!numberIsFinite(value)) {
    throw new RangeErrorConstructor(`Invalid value ${value}`)
  }
  const resolvedUnit = SingularRelativeTimeUnit(unit)
  let entry: RelativeTimeField = resolvedUnit
  if (style === 'short') {
    entry = `${resolvedUnit}-short` as RelativeTimeField
  } else if (style === 'narrow') {
    entry = `${resolvedUnit}-narrow` as RelativeTimeField
  }
  // Steps 6–7 check Record fields, which have no inherited properties.
  if (!hasOwn(fields, entry)) {
    entry = resolvedUnit as RelativeTimeField
  }
  const patterns = fields[entry]!

  if (numeric === 'auto') {
    const valueString = ToString(value) as '-1' | '0' | '1'
    if (hasOwn(patterns, valueString)) {
      return [
        {
          type: 'literal',
          value: patterns[valueString]!,
        },
      ]
    }
  }
  // Steps 8–10: negative zero uses the past pattern too.
  let tl: keyof FieldData = 'future'
  if (SameValue(value, -0) || value < 0) {
    tl = 'past'
  }
  const po = patterns[tl]
  // Step 11 passes the signed value. The past pattern supplies the direction,
  // so Test262 expects the numeric placeholder to contain the magnitude.
  // https://github.com/tc39/test262/blob/2a1ade303f72d3de80565c921d685222405c32ce/test/intl402/RelativeTimeFormat/prototype/formatToParts/en-us-numeric-always.js#L79-L82
  const fv = formatNumber(abs(value))
  const pr = selectPlural(value)
  // ECMA-402 assumes a pattern for every relevant plural category. Our CLDR
  // data is sparse (e.g. gsw has `other` but no `one`), so resolve CLDR's
  // count fallback here rather than duplicating patterns in locale data.
  // Step 13 reads a Record field. An inherited property cannot supply a pattern.
  // https://tc39.es/ecma402/#sec-Intl.RelativeTimeFormat-internal-slots
  // https://unicode.org/reports/tr35/tr35.html#Lateral_Inheritance
  const pattern = (hasOwn(po, pr) ? po[pr] : undefined) ?? po.other
  return MakePartsList(pattern!, resolvedUnit, fv)
}
