import {ToNumber} from '@formatjs/ecma402-abstract'

export function ToIntegerIfIntegral(arg: any): number {
  const number = ToNumber(arg)
  if (!Number.isInteger(number)) {
    throw new RangeError(`${arg} is not an integer`)
  }
  return number
}
