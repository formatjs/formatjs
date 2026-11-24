import {IsObject} from '#packages/ecma262-abstract/IsObject.js'

// Capture realm intrinsics before coercion invokes user code.
const functionToString = Function.prototype.toString
const apply = Reflect.apply
const toPrimitiveSymbol = Symbol.toPrimitive
const TypeErrorConstructor = TypeError
const ErrorConstructor = Error

type Primitive = string | number | bigint | boolean | symbol | undefined | null

function IsPrimitive(value: unknown): value is Primitive {
  return !IsObject(value)
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
  if (typeof fn === 'function') return true
  if (typeof fn !== 'undefined' || fn === undefined) return false
  // Function.prototype.toString tests [[Call]] without invoking the value.
  try {
    apply(functionToString, fn, [])
    return true
  } catch {
    return false
  }
}

// ECMA-262 §7.1.1.1 reads methods in hint order and returns the first primitive.
// https://tc39.es/ecma262/#sec-ordinarytoprimitive
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
  if (IsObject(input)) {
    const exoticToPrim = (input as Record<symbol, unknown>)[toPrimitiveSymbol]
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
      let result = apply(exoticToPrim as Function, input, [hint])
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
