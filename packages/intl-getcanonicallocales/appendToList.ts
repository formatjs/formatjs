// ECMA-402 §9.2.1, step 7.c.vii appends to a specification List.
// https://tc39.es/ecma402/#sec-canonicalizelocalelist
// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L68-L69
// ECMA-262 §7.3.17 CreateArrayFromList, step 3.a creates own data properties.
// https://tc39.es/ecma262/#sec-createarrayfromlist
// https://github.com/tc39/ecma262/blob/b7865f0eed2021720f84d561289401bc414874d0/spec.html#L6556-L6561
export function appendToList<T>(list: T[], ...values: T[]): void {
  for (const value of values) {
    Object.defineProperty(list, list.length, {
      value,
      writable: true,
      enumerable: true,
      configurable: true,
    })
  }
}
