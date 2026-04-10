import {Decimal} from '@formatjs/bigdecimal'
import {ToPrimitive} from './ToPrimitive.js'

const ZERO = new Decimal(0)

function invariant(
  condition: boolean,
  message: string,
  Err: typeof Error = Error
): asserts condition {
  if (!condition) {
    throw new Err(message)
  }
}

/**
 * https://tc39.es/ecma262/#sec-tonumber
 */
export function ToNumber(arg: any): Decimal {
  if (typeof arg === 'number') {
    return new Decimal(arg)
  }
  if (typeof arg === 'bigint') {
    return new Decimal(arg.toString())
  }
  invariant(typeof arg !== 'symbol', 'Symbol is not supported', TypeError)
  if (arg === undefined) {
    return new Decimal(NaN)
  }
  if (arg === null || arg === 0) {
    return ZERO
  }
  if (arg === true) {
    return new Decimal(1)
  }
  if (typeof arg === 'string') {
    try {
      return new Decimal(arg)
    } catch {
      return new Decimal(NaN)
    }
  }
  invariant(typeof arg === 'object', 'object expected', TypeError)
  let primValue = ToPrimitive(arg, 'number')
  invariant(typeof primValue !== 'object', 'object expected', TypeError)
  return ToNumber(primValue)
}
