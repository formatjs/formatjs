/**
 * https://www.ecma-international.org/ecma-262/11.0/index.html#sec-type
 */
export function Type(
  x: any
):
  | 'Null'
  | 'Undefined'
  | 'Object'
  | 'Number'
  | 'Boolean'
  | 'String'
  | 'Symbol'
  | 'BigInt'
  | undefined {
  if (x === null) {
    return 'Null'
  }
  if (typeof x === 'undefined') {
    return 'Undefined'
  }
  if (typeof x === 'function' || typeof x === 'object') {
    return 'Object'
  }
  if (typeof x === 'number') {
    return 'Number'
  }
  if (typeof x === 'boolean') {
    return 'Boolean'
  }
  if (typeof x === 'string') {
    return 'String'
  }
  if (typeof x === 'symbol') {
    return 'Symbol'
  }
  if (typeof x === 'bigint') {
    return 'BigInt'
  }
}
