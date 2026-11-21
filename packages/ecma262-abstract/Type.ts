import {IsObject} from '#packages/ecma262-abstract/IsObject.js'

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
  if (x === undefined) {
    return 'Undefined'
  }
  if (IsObject(x)) {
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
