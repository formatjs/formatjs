import {setDataProperty} from '#packages/ecma262-abstract/intrinsics.js'

// ECMA-402 §9.2.1 step 7.c.vii appends to a specification List.
// https://tc39.es/ecma402/#sec-canonicalizelocalelist
// ECMA-262 §7.3.17 CreateArrayFromList, step 3.a creates own data properties.
// https://tc39.es/ecma262/#sec-createarrayfromlist
export function appendToList<T>(list: T[], ...values: T[]): void {
  for (let index = 0; index < values.length; index++)
    setDataProperty(list, list.length, values[index])
}
