// Capture realm intrinsics before coercion invokes user code.
const apply = Reflect.apply
const toPrimitiveSymbol = Symbol.toPrimitive
const TypeErrorConstructor = TypeError
const ErrorConstructor = Error

type Primitive = string | number | bigint | boolean | symbol | undefined | null

function IsPrimitive(value: unknown): value is Primitive {
  return (
    value === null || (typeof value !== 'object' && typeof value !== 'function')
  )
}

function invariant(
  condition: boolean,
  message: string,
  Err: typeof Error = ErrorConstructor
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
>(O: object, hint: T): Primitive {
  let methodNames: Array<'toString' | 'valueOf'>
  if (hint === 'string') {
    methodNames = ['toString', 'valueOf']
  } else {
    methodNames = ['valueOf', 'toString']
  }
  // Traverse the specification's private List by index.
  for (let index = 0; index < methodNames.length; index++) {
    const name = methodNames[index]
    const method = O[name]
    if (IsCallable(method)) {
      let result = apply(method, O, [])
      if (IsPrimitive(result)) {
        return result
      }
    }
  }
  throw new TypeErrorConstructor('Cannot convert object to primitive value')
}

/**
 * https://tc39.es/ecma262/#sec-toprimitive
 */
export function ToPrimitive<
  T extends 'string' | 'number' = 'string' | 'number',
>(input: any, preferredType: T): Primitive {
  if (
    input !== null &&
    (typeof input === 'object' || typeof input === 'function')
  ) {
    const exoticToPrim = input[toPrimitiveSymbol]
    let hint
    if (exoticToPrim !== undefined && exoticToPrim !== null) {
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
      let result = apply(exoticToPrim, input, [hint])
      if (IsPrimitive(result)) {
        return result
      }
      throw new TypeErrorConstructor(
        'Cannot convert exotic object to primitive.'
      )
    }
    if (preferredType === undefined) {
      preferredType = 'number' as T
    }
    return OrdinaryToPrimitive(input, preferredType)
  }
  return input
}
