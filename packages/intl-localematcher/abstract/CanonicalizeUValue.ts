import {invariant} from './utils'

export function CanonicalizeUValue(ukey: string, uvalue: string): string {
  // TODO: Implement algorithm for CanonicalizeUValue per https://tc39.es/ecma402/#sec-canonicalizeuvalue
  let lowerValue = uvalue.toLowerCase()
  invariant(ukey !== undefined, `ukey must be defined`)
  let canonicalized = lowerValue
  return canonicalized
}
