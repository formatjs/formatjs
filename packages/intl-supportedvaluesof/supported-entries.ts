import {setDataProperty} from '#packages/ecma262-abstract/intrinsics.js'

const apply = Reflect.apply
const sort = Array.prototype.sort

// ECMA-402 §8.3.2 returns a fresh array from a private, sorted List.
// https://tc39.es/ecma402/#sec-intl.supportedvaluesof
export function supportedEntries<T extends string>(
  candidates: readonly T[],
  supported: (entry: T) => boolean
): T[] {
  const result: T[] = []
  for (let index = 0; index < candidates.length; index++) {
    const entry = candidates[index]
    if (supported(entry)) setDataProperty(result, `${result.length}`, entry)
  }
  apply(sort, result, [])
  return result
}
