import {
  NumberFormatDigitOptions,
  NumberFormatNotation,
  NumberFormatDigitInternalSlots,
} from '../types/number'
import {GetNumberOption} from '../GetNumberOption'
import {DefaultNumberOption} from '../DefaultNumberOption'
import {GetOption} from '../GetOption'

/**
 * https://tc39.es/ecma402/#sec-setnfdigitoptions
 */
export function SetNumberFormatDigitOptions(
  internalSlots: NumberFormatDigitInternalSlots,
  opts: NumberFormatDigitOptions,
  mnfdDefault: number,
  mxfdDefault: number,
  notation: NumberFormatNotation
) {
  const mnid = GetNumberOption(opts, 'minimumIntegerDigits', 1, 21, 1)
  let mnfd = opts.minimumFractionDigits
  let mxfd = opts.maximumFractionDigits
  let mnsd = opts.minimumSignificantDigits
  let mxsd = opts.maximumSignificantDigits
  internalSlots.minimumIntegerDigits = mnid
  const roundingPriority = GetOption(
    opts,
    'roundingPriority',
    'string',
    ['auto', 'morePrecision', 'lessPrecision'],
    'auto'
  )
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
      mnsd = DefaultNumberOption(mnsd, 1, 21, 1)
      mxsd = DefaultNumberOption(mxsd, mnsd, 21, 21)
      internalSlots.minimumSignificantDigits = mnsd
      internalSlots.maximumSignificantDigits = mxsd
    } else {
      internalSlots.minimumSignificantDigits = 1
      internalSlots.maximumSignificantDigits = 21
    }
  }
  if (needFd) {
    if (hasFd) {
      // @ts-expect-error
      mnfd = DefaultNumberOption(mnfd, 0, 20, undefined)
      // @ts-expect-error
      mxfd = DefaultNumberOption(mxfd, 0, 20, undefined)
      if (mnfd === undefined) {
        mnfd = Math.min(mnfdDefault, mxfd)
      } else if (mxfd === undefined) {
        mxfd = Math.max(mxfdDefault, mnfd)
      } else if (mnfd > mxfd) {
        throw new RangeError(`Invalid range, ${mnfd} > ${mxfd}`)
      }
      internalSlots.minimumFractionDigits = mnfd
      internalSlots.maximumFractionDigits = mxfd
    } else {
      internalSlots.minimumFractionDigits = mnfdDefault
      internalSlots.maximumFractionDigits = mxfdDefault
    }
  }
  if (needSd || needFd) {
    if (roundingPriority === 'morePrecision') {
      internalSlots.roundingType = 'morePrecision'
    } else if (roundingPriority === 'lessPrecision') {
      internalSlots.roundingType = 'lessPrecision'
    } else if (hasSd) {
      internalSlots.roundingType = 'significantDigits'
    } else {
      internalSlots.roundingType = 'fractionDigits'
    }
  } else {
    internalSlots.roundingType = 'morePrecision'
    internalSlots.minimumFractionDigits = 0
    internalSlots.maximumFractionDigits = 0
    internalSlots.minimumSignificantDigits = 1
    internalSlots.maximumSignificantDigits = 2
  }
}
