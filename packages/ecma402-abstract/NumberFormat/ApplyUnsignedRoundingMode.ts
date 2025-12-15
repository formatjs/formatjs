import {Decimal} from 'decimal.js'
import {UnsignedRoundingModeType} from '../types/number.js'
import {invariant} from '../utils.js'

export function ApplyUnsignedRoundingMode(
  x: Decimal,
  r1: Decimal,
  r2: Decimal,
  unsignedRoundingMode: UnsignedRoundingModeType
): Decimal {
  if (x.eq(r1)) return r1
  invariant(
    r1.lessThan(x) && x.lessThan(r2),
    `x should be between r1 and r2 but x=${x}, r1=${r1}, r2=${r2}`
  )

  if (unsignedRoundingMode === 'zero') {
    return r1
  }
  if (unsignedRoundingMode === 'infinity') {
    return r2
  }

  const d1 = x.minus(r1)
  const d2 = r2.minus(x)

  if (d1.lessThan(d2)) {
    return r1
  }
  if (d2.lessThan(d1)) {
    return r2
  }

  invariant(d1.eq(d2), 'd1 should be equal to d2')

  if (unsignedRoundingMode === 'half-zero') {
    return r1
  }
  if (unsignedRoundingMode === 'half-infinity') {
    return r2
  }

  invariant(
    unsignedRoundingMode === 'half-even',
    'unsignedRoundingMode should be half-even'
  )

  const cardinality = r1.div(r2.minus(r1)).mod(2)

  if (cardinality.isZero()) {
    return r1
  }
  return r2
}
