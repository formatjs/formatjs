import {DefaultNumberOption} from '../DefaultNumberOption'
import {GetNumberOption} from '../GetNumberOption'
import {GetOption} from '../GetOption'
import {
  NumberFormatDigitInternalSlots,
  NumberFormatDigitOptions,
  NumberFormatNotation,
} from '../types/number'
import {invariant} from '../utils'

const VALID_ROUNDING_INCREMENTS = new Set([
  1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000,
])

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
  const mnid = GetNumberOption(opts, 'minimumIntegerDigits', 1, 21, 1)
  let mnfd = opts.minimumFractionDigits
  let mxfd = opts.maximumFractionDigits
  let mnsd = opts.minimumSignificantDigits
  let mxsd = opts.maximumSignificantDigits
  internalSlots.minimumIntegerDigits = mnid
  const roundingIncrement = GetNumberOption(
    opts,
    'roundingIncrement',
    1,
    5000,
    1
  )
  invariant(
    VALID_ROUNDING_INCREMENTS.has(roundingIncrement),
    `Invalid rounding increment value: ${roundingIncrement}.
Valid values are ${Array.from(VALID_ROUNDING_INCREMENTS).join(', ')}.`
  )
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
    ['auto', 'stripIfInteger'],
    'auto'
  )
  if (roundingIncrement !== 1) {
    mxfdDefault = mnfdDefault
  }
  internalSlots.roundingIncrement = roundingIncrement
  internalSlots.roundingMode = roundingMode
  internalSlots.trailingZeroDisplay = trailingZeroDisplay
  const hasSd = mnsd !== undefined || mxsd !== undefined
  const hasFd = mnfd !== undefined || mxfd !== undefined
  let needSd = true
  let needFd = true
  if (roundingPriority === 'auto') {
    needSd = hasSd
    if (hasSd || (!hasFd && notation === 'compact')) {
      needFd = false
    }
  }
  if (needSd) {
    if (hasSd) {
      internalSlots.minimumSignificantDigits = DefaultNumberOption(
        mnsd,
        1,
        21,
        1
      )
      internalSlots.maximumSignificantDigits = DefaultNumberOption(
        mxsd,
        internalSlots.minimumSignificantDigits,
        21,
        21
      )
    } else {
      internalSlots.minimumSignificantDigits = 1
      internalSlots.maximumSignificantDigits = 21
    }
  }
  if (needFd) {
    if (hasFd) {
      mnfd = DefaultNumberOption(mnfd, 0, 100, undefined)
      mxfd = DefaultNumberOption(mxfd, 0, 100, undefined)
      if (mnfd === undefined) {
        mnfd = Math.min(mnfdDefault, mxfd ?? 0)
      } else if (mxfd === undefined) {
        mxfd = Math.max(mxfdDefault, mnfd)
      } else if (mnfd > mxfd) {
        throw new RangeError(`Invalid range, ${mnfd} > ${mxfd}`)
      }
      internalSlots.minimumFractionDigits = mnfd
      internalSlots.maximumFractionDigits = mxfd!
    } else {
      internalSlots.minimumFractionDigits = mnfdDefault
      internalSlots.maximumFractionDigits = mxfdDefault
    }
  }
  if (!needSd && !needFd) {
    internalSlots.minimumFractionDigits = 0
    internalSlots.maximumFractionDigits = 0
    internalSlots.minimumSignificantDigits = 1
    internalSlots.maximumSignificantDigits = 2
    internalSlots.roundingType = 'morePrecision'
    internalSlots.roundingPriority = 'morePrecision'
  } else if (roundingPriority === 'morePrecision') {
    internalSlots.roundingType = 'morePrecision'
    internalSlots.roundingPriority = 'morePrecision'
  } else if (roundingPriority === 'lessPrecision') {
    internalSlots.roundingType = 'lessPrecision'
    internalSlots.roundingPriority = 'lessPrecision'
  } else if (hasSd) {
    internalSlots.roundingType = 'significantDigits'
    internalSlots.roundingPriority = 'auto'
  } else {
    internalSlots.roundingType = 'fractionDigits'
    internalSlots.roundingPriority = 'auto'
  }
  if (roundingIncrement !== 1) {
    invariant(
      internalSlots.roundingType === 'fractionDigits',
      'Invalid roundingType'
    )
    invariant(
      internalSlots.maximumFractionDigits ===
        internalSlots.minimumFractionDigits,
      'With roundingIncrement > 1, maximumFractionDigits and minimumFractionDigits must be equal.'
    )
  }
}
