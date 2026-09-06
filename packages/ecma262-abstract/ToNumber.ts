import {Decimal} from '@formatjs/bigdecimal'

/**
 * ECMA-262 §7.1.4 ToNumber, steps 2, 8–10.
 * https://tc39.es/ecma262/#sec-tonumber
 * https://github.com/tc39/ecma262/blob/dcf59856a8184792a9e42f0ffb7dc064094a5dcc/spec.html#L5183-L5191
 */
export function ToNumber(arg: any): Decimal {
  // Unary + evaluation step 2 returns ? ToNumber, preserving abrupt completions
  // from ToPrimitive and rejecting BigInt/Symbol before constructing Decimal.
  // ECMA-262 §13.5.4.1 Unary + evaluation, step 2.
  // https://tc39.es/ecma262/#sec-unary-plus-operator-runtime-semantics-evaluation
  // https://github.com/tc39/ecma262/blob/dcf59856a8184792a9e42f0ffb7dc064094a5dcc/spec.html#L20666
  return new Decimal(+arg)
}
