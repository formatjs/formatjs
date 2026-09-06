import {Decimal} from '@formatjs/bigdecimal'

/** https://tc39.es/ecma262/#sec-tonumber */
export function ToNumber(arg: any): Decimal {
  // Unary plus performs ToNumber, including object coercion and rejection of
  // BigInt/Symbol. Decimal preserves that Number result for downstream arithmetic.
  return new Decimal(+arg)
}
