/**
 * https://www.ecma-international.org/ecma-262/11.0/index.html#sec-hasownproperty
 */
export function HasOwnProperty(o: object, prop: string): boolean {
  return Object.prototype.hasOwnProperty.call(o, prop)
}
