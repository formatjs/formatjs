import {invariant, ToNumber} from '@formatjs/ecma402-abstract'

export function ToIntegerIfIntegral(arg: any): number {
  const number = ToNumber(arg)
  invariant(number.isInteger(), `${arg} is not an integer`)
  return number.toNumber()
}
