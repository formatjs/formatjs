import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  arrayIncludes,
  mathMax,
  mathMin,
} from '#packages/ecma262-abstract/intrinsics.js'
import {DefaultNumberOption} from '#packages/ecma402-abstract/DefaultNumberOption.js'
import {GetNumberOption} from '#packages/ecma402-abstract/GetNumberOption.js'
import {GetOption} from '#packages/ecma402-abstract/GetOption.js'
import {
  type NumberFormatDigitInternalSlots,
  type NumberFormatDigitOptions,
  type NumberFormatNotation,
} from '#packages/ecma402-abstract/types/number.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'

// ECMA-402 §16.1.2 step 7 uses a private List of allowed increments.
// https://tc39.es/ecma402/#sec-setnumberformatdigitoptions
const VALID_ROUNDING_INCREMENTS = [
  1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000,
]
const validRoundingIncrementList = VALID_ROUNDING_INCREMENTS.join(', ')

/**
 * https://tc39.es/ecma402/#sec-setnfdigitoptions
 */
export function SetNumberFormatDigitOptions(
  internalSlots: NumberFormatDigitInternalSlots,
  opts: NumberFormatDigitOptions,
  mnfdDefault: number,
  mxfdDefault: number,
  notation: NumberFormatNotation
): void {
  // 1. Let mnid be ? GetNumberOption(opts, "minimumIntegerDigits", 1, 21, 1).
  const mnid = GetNumberOption(opts, 'minimumIntegerDigits', 1, 21, 1)

  // Steps 2–5 read the precision values before coercing the active ones.
  let mnfd = opts.minimumFractionDigits
  let mxfd = opts.maximumFractionDigits
  let mnsd = opts.minimumSignificantDigits
  let mxsd = opts.maximumSignificantDigits

  // Step 6 reads and coerces roundingIncrement before checking membership.
  const roundingIncrement = GetNumberOption(
    opts,
    'roundingIncrement',
    1,
    5000,
    1
  )

  // ECMA-402 §16.1.2 step 7 throws without calling public collection methods.
  // https://tc39.es/ecma402/#sec-setnumberformatdigitoptions
  if (!arrayIncludes(VALID_ROUNDING_INCREMENTS, roundingIncrement)) {
    throw new RangeErrorConstructor(
      `Invalid rounding increment value: ${roundingIncrement}.
Valid values are ${validRoundingIncrementList}.`
    )
  }

  // Steps 8–10 read rounding mode, priority, and trailing-zero display.
  const roundingMode = GetOption(
    opts,
    'roundingMode',
    'string',
    [
      'ceil',
      'floor',
      'expand',
      'trunc',
      'halfCeil',
      'halfFloor',
      'halfExpand',
      'halfTrunc',
      'halfEven',
    ],
    'halfExpand'
  )

  const roundingPriority = GetOption(
    opts,
    'roundingPriority',
    'string',
    ['auto', 'morePrecision', 'lessPrecision'],
    'auto'
  )

  const trailingZeroDisplay = GetOption(
    opts,
    'trailingZeroDisplay',
    'string',
    ['auto', 'stripIfInteger', 'stripToMinimum'],
    'auto'
  )

  // Steps 11–12 finish option reads and adjust the default fraction width.
  if (roundingIncrement !== 1) {
    // 12.a. Set mxfdDefault to mnfdDefault.
    mxfdDefault = mnfdDefault
  }

  // Steps 13–16 store the resolved digit and rounding settings.
  internalSlots.minimumIntegerDigits = mnid
  internalSlots.roundingIncrement = roundingIncrement
  internalSlots.roundingMode = roundingMode
  internalSlots.trailingZeroDisplay = trailingZeroDisplay

  // Steps 17–18 record which precision options were supplied.
  const hasSd = mnsd !== undefined || mxsd !== undefined
  const hasFd = mnfd !== undefined || mxfd !== undefined
  let needSd = true
  let needFd = true
  // Steps 19–20 choose which precision rules apply.
  if (roundingPriority === 'auto') {
    // 20.a. Set needSd to hasSd.
    needSd = hasSd

    // 20.b. If hasSd is true or hasFd is false and notation is "compact", then
    if (hasSd || (!hasFd && notation === 'compact')) {
      // 20.b.i. Set needFd to false.
      needFd = false
    }
  }

  // 21. If needSd is true, then
  if (needSd) {
    // 21.a. If hasSd is true, then
    if (hasSd) {
      // 21.a.i. Set internalSlots.[[MinimumSignificantDigits]] to ? DefaultNumberOption(mnsd, 1, 21, 1).
      internalSlots.minimumSignificantDigits = DefaultNumberOption(
        mnsd,
        1,
        21,
        1
      )

      // 21.a.ii. Set internalSlots.[[MaximumSignificantDigits]] to ? DefaultNumberOption(mxsd, internalSlots.[[MinimumSignificantDigits]], 21, 21).
      internalSlots.maximumSignificantDigits = DefaultNumberOption(
        mxsd,
        internalSlots.minimumSignificantDigits,
        21,
        21
      )
    } else {
      // 21.b. Else,
      // 21.b.i. Set internalSlots.[[MinimumSignificantDigits]] to 1.
      internalSlots.minimumSignificantDigits = 1

      // 21.b.ii. Set internalSlots.[[MaximumSignificantDigits]] to 21.
      internalSlots.maximumSignificantDigits = 21
    }
  }

  // 22. If needFd is true, then
  if (needFd) {
    // 22.a. If hasFd is true, then
    if (hasFd) {
      // 22.a.i. Set mnfd to ? DefaultNumberOption(mnfd, 0, 100, undefined).
      mnfd = DefaultNumberOption(mnfd, 0, 100, undefined)

      // 22.a.ii. Set mxfd to ? DefaultNumberOption(mxfd, 0, 100, undefined).
      mxfd = DefaultNumberOption(mxfd, 0, 100, undefined)

      // 22.a.iii. If mnfd is undefined, then
      if (mnfd === undefined) {
        // 22.a.iii.1. Assert: mxfd is not undefined.
        invariant(mxfd !== undefined, 'maximumFractionDigits must be defined')

        // 22.a.iii.2. Set mnfd to min(mnfdDefault, mxfd).
        mnfd = mathMin(mnfdDefault, mxfd)
      } else if (mxfd === undefined) {
        // 22.a.iv. Else if mxfd is undefined, then
        // 22.a.iv.1. Set mxfd to max(mxfdDefault, mnfd).
        mxfd = mathMax(mxfdDefault, mnfd)
      } else if (mnfd > mxfd) {
        // 22.a.v. Else if mnfd > mxfd, throw a RangeError exception.
        throw new RangeErrorConstructor(`Invalid range, ${mnfd} > ${mxfd}`)
      }

      // 22.a.vi. Set internalSlots.[[MinimumFractionDigits]] to mnfd.
      internalSlots.minimumFractionDigits = mnfd

      // 22.a.vii. Set internalSlots.[[MaximumFractionDigits]] to mxfd.
      internalSlots.maximumFractionDigits = mxfd!
    } else {
      // 22.b. Else,
      // 22.b.i. Set internalSlots.[[MinimumFractionDigits]] to mnfdDefault.
      internalSlots.minimumFractionDigits = mnfdDefault

      // 22.b.ii. Set internalSlots.[[MaximumFractionDigits]] to mxfdDefault.
      internalSlots.maximumFractionDigits = mxfdDefault
    }
  }

  // 23. If needSd is false and needFd is false, then
  if (!needSd && !needFd) {
    // 23.a. Set internalSlots.[[MinimumFractionDigits]] to 0.
    internalSlots.minimumFractionDigits = 0

    // 23.b. Set internalSlots.[[MaximumFractionDigits]] to 0.
    internalSlots.maximumFractionDigits = 0

    // 23.c. Set internalSlots.[[MinimumSignificantDigits]] to 1.
    internalSlots.minimumSignificantDigits = 1

    // 23.d. Set internalSlots.[[MaximumSignificantDigits]] to 2.
    internalSlots.maximumSignificantDigits = 2

    // 23.e. Set internalSlots.[[RoundingType]] to "morePrecision".
    internalSlots.roundingType = 'morePrecision'

    // 23.f. Set internalSlots.[[RoundingPriority]] to "morePrecision".
    internalSlots.roundingPriority = 'morePrecision'
  } else if (roundingPriority === 'morePrecision') {
    // 24. Else if roundingPriority is "morePrecision", then
    // 24.a. Set internalSlots.[[RoundingType]] to "morePrecision".
    internalSlots.roundingType = 'morePrecision'

    // 24.b. Set internalSlots.[[RoundingPriority]] to "morePrecision".
    internalSlots.roundingPriority = 'morePrecision'
  } else if (roundingPriority === 'lessPrecision') {
    // 25. Else if roundingPriority is "lessPrecision", then
    // 25.a. Set internalSlots.[[RoundingType]] to "lessPrecision".
    internalSlots.roundingType = 'lessPrecision'

    // 25.b. Set internalSlots.[[RoundingPriority]] to "lessPrecision".
    internalSlots.roundingPriority = 'lessPrecision'
  } else if (hasSd) {
    // 26. Else if hasSd is true, then
    // 26.a. Set internalSlots.[[RoundingType]] to "significantDigits".
    internalSlots.roundingType = 'significantDigits'

    // 26.b. Set internalSlots.[[RoundingPriority]] to "auto".
    internalSlots.roundingPriority = 'auto'
  } else {
    // 27. Else,
    // 27.a. Set internalSlots.[[RoundingType]] to "fractionDigits".
    internalSlots.roundingType = 'fractionDigits'

    // 27.b. Set internalSlots.[[RoundingPriority]] to "auto".
    internalSlots.roundingPriority = 'auto'
  }

  // 28. If roundingIncrement is not 1, then
  if (roundingIncrement !== 1) {
    // 28.a. Assert: internalSlots.[[RoundingType]] is "fractionDigits".
    invariant(
      internalSlots.roundingType === 'fractionDigits',
      'Invalid roundingType',
      TypeErrorConstructor
    )

    // 28.b. Assert: internalSlots.[[MaximumFractionDigits]] is equal to internalSlots.[[MinimumFractionDigits]].
    invariant(
      internalSlots.maximumFractionDigits ===
        internalSlots.minimumFractionDigits,
      'With roundingIncrement > 1, maximumFractionDigits and minimumFractionDigits must be equal.',
      RangeErrorConstructor
    )
  }
}
