import {Decimal} from '@formatjs/bigdecimal'

/** https://tc39.es/ecma262/#sec-tonumber */
export function ToNumber(arg: any): Decimal {
  // Unary + evaluation step 3 returns ? ToNumber, preserving abrupt completions
  // from ToPrimitive and rejecting BigInt/Symbol before constructing Decimal.
  // https://tc39.es/ecma262/#sec-unary-plus-operator-runtime-semantics-evaluation
  return new Decimal(+arg)
}
