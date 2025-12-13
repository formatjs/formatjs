import Decimal from 'decimal.js'
import {ToPrimitive} from './262'

export function ToIntlMathematicalValue(input: unknown): Decimal {
  let primValue = ToPrimitive(input, 'number')
  if (typeof primValue === 'bigint') {
    return new Decimal(primValue)
  }
  // IMPL
  if (primValue === undefined) {
    return new Decimal(NaN)
  }
  if (primValue === true) {
    return new Decimal(1)
  }
  if (primValue === false) {
    return new Decimal(0)
  }
  if (primValue === null) {
    return new Decimal(0)
  }
  try {
    return new Decimal(primValue)
  } catch {
    return new Decimal(NaN)
  }
}
