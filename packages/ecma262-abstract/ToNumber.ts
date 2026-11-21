/** ECMA-262 §7.1.4, via §13.5.4.1 step 2. */
export function ToNumber(arg: unknown): number {
  return +(arg as number)
}
