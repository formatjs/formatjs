const ArrayConstructor = Array
const setPrototypeOf = Object.setPrototypeOf

// ECMA-262 §10.4.2.2 steps 1–7 check length, allocate and set the prototype.
// https://tc39.es/ecma262/#sec-arraycreate
export function ArrayCreate<T = any>(len: number, proto?: object): T[] {
  const array = new ArrayConstructor<T>(len)
  if (proto !== undefined) setPrototypeOf(array, proto)
  return array
}
