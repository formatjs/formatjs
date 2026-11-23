const ArrayConstructor = Array
const setPrototypeOf = Object.setPrototypeOf

/** ECMA-262 §10.4.2.2. Length is a non-negative integer. */
export function ArrayCreate<T = any>(len: number, proto?: object): T[] {
  const array = new ArrayConstructor<T>(len)
  if (proto !== undefined) setPrototypeOf(array, proto)
  return array
}
