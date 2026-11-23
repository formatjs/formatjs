import {setDataProperty} from '#packages/ecma262-abstract/intrinsics.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'

const apply = Reflect.apply
const stringIndexOf = String.prototype.indexOf
const substring = String.prototype.substring

// ECMA-402 §9.2.15 splits a private Pattern String into literals and fields.
// https://tc39.es/ecma402/#sec-partitionpattern
// https://tc39.es/ecma402/#sec-pattern-string-types
export function PartitionPattern<T extends string>(
  pattern: string
): Array<{type: T; value: string | undefined}> {
  const result: Array<{type: T; value: string | undefined}> = []
  let placeholderEnd = -1
  let placeholderStart = apply(stringIndexOf, pattern, ['{', 0]) as number
  while (placeholderStart !== -1) {
    const literal = apply(substring, pattern, [
      placeholderEnd + 1,
      placeholderStart,
    ]) as string
    if (literal !== '') {
      setDataProperty(result, `${result.length}`, {
        type: 'literal' as T,
        value: literal,
      })
    }
    placeholderEnd = apply(stringIndexOf, pattern, [
      '}',
      placeholderStart,
    ]) as number
    invariant(placeholderEnd > placeholderStart, `Invalid pattern ${pattern}`)
    const placeholderName = apply(substring, pattern, [
      placeholderStart + 1,
      placeholderEnd,
    ]) as T
    setDataProperty(result, `${result.length}`, {
      type: placeholderName,
      value: undefined,
    })
    placeholderStart = apply(stringIndexOf, pattern, [
      '{',
      placeholderEnd,
    ]) as number
  }
  const tail = apply(substring, pattern, [placeholderEnd + 1]) as string
  if (tail !== '') {
    setDataProperty(result, `${result.length}`, {
      type: 'literal' as T,
      value: tail,
    })
  }
  return result
}
