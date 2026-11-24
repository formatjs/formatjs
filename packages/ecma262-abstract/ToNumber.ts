// ECMA-262 §7.1.4 via unary plus (§13.5.4.1 step 2).
// https://tc39.es/ecma262/#sec-tonumber
export function ToNumber(arg: unknown): number {
  return +(arg as number)
}
