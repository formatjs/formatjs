function invariant(
  condition: boolean,
  message: string,
  Err: typeof Error = Error
): asserts condition {
  if (!condition) {
    throw new Err(message)
  }
}

function IsCallable(fn: any): fn is Function {
  return typeof fn === 'function'
}

function OrdinaryToPrimitive<
  T extends 'string' | 'number' = 'string' | 'number',
>(O: object, hint: T): string | number | boolean | undefined | null {
  let methodNames: Array<'toString' | 'valueOf'>
  if (hint === 'string') {
    methodNames = ['toString', 'valueOf']
  } else {
    methodNames = ['valueOf', 'toString']
  }
  for (const name of methodNames) {
    const method = O[name]
    if (IsCallable(method)) {
      let result = method.call(O)
      if (typeof result !== 'object') {
        return result
      }
    }
  }
  throw new TypeError('Cannot convert object to primitive value')
}

/**
 * https://tc39.es/ecma262/#sec-toprimitive
 */
export function ToPrimitive<
  T extends 'string' | 'number' = 'string' | 'number',
>(input: any, preferredType: T): string | number | boolean | undefined | null {
  if (typeof input === 'object' && input != null) {
    const exoticToPrim =
      Symbol.toPrimitive in input ? input[Symbol.toPrimitive] : undefined
    let hint
    if (exoticToPrim !== undefined) {
      if (preferredType === undefined) {
        hint = 'default'
      } else if (preferredType === 'string') {
        hint = 'string'
      } else {
        invariant(
          preferredType === 'number',
          'preferredType must be "string" or "number"'
        )
        hint = 'number'
      }
      let result = exoticToPrim.call(input, hint)
      if (typeof result !== 'object') {
        return result
      }
      throw new TypeError('Cannot convert exotic object to primitive.')
    }
    if (preferredType === undefined) {
      preferredType = 'number' as T
    }
    return OrdinaryToPrimitive(input, preferredType)
  }
  return input
}
