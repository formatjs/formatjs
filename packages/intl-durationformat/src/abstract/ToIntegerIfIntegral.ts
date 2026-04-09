import {ToNumber} from '@formatjs/ecma402-abstract/262.js'
import {invariant} from '@formatjs/ecma402-abstract/utils.js'

export function ToIntegerIfIntegral(arg: any): number {
  const number = ToNumber(arg)
  invariant(number.isInteger(), `${arg} is not an integer`)
  return number.toNumber()
}
