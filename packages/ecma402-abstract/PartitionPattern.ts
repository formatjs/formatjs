import {invariant} from './utils'

/**
 * Partition a pattern into a list of literals and placeholders
 * https://tc39.es/ecma402/#sec-partitionpattern
 * @param pattern
 */
export function PartitionPattern<T extends string>(
  pattern: string
): Array<{type: T; value: string | undefined}> {
  const result = []
  let beginIndex = pattern.indexOf('{')
  let endIndex = 0
  let nextIndex = 0
  const length = pattern.length
  while (beginIndex < pattern.length && beginIndex > -1) {
    endIndex = pattern.indexOf('}', beginIndex)
    invariant(endIndex > beginIndex, `Invalid pattern ${pattern}`)
    if (beginIndex > nextIndex) {
      result.push({
        type: 'literal' as T,
        value: pattern.substring(nextIndex, beginIndex),
      })
    }
    result.push({
      type: pattern.substring(beginIndex + 1, endIndex) as T,
      value: undefined,
    })
    nextIndex = endIndex + 1
    beginIndex = pattern.indexOf('{', nextIndex)
  }
  if (nextIndex < length) {
    result.push({
      type: 'literal' as T,
      value: pattern.substring(nextIndex, length),
    })
  }
  return result
}
