function IsCallable(fn: any): fn is Function {
  return typeof fn === 'function'
}

/**
 * https://tc39.es/ecma262/#sec-ordinaryhasinstance
 */
export function OrdinaryHasInstance(
  C: object,
  O: any,
  internalSlots?: {boundTargetFunction: any}
): boolean {
  if (!IsCallable(C)) {
    return false
  }
  if (internalSlots?.boundTargetFunction) {
    let BC = internalSlots?.boundTargetFunction
    return O instanceof BC
  }
  if (O === null || (typeof O !== 'object' && typeof O !== 'function')) {
    return false
  }
  let P = C.prototype
  if (P === null || (typeof P !== 'object' && typeof P !== 'function')) {
    throw new TypeError(
      'OrdinaryHasInstance called on an object with an invalid prototype property.'
    )
  }
  return Object.prototype.isPrototypeOf.call(P, O)
}
