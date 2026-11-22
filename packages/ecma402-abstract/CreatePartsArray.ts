import {ArrayCreate} from '#packages/ecma262-abstract/ArrayCreate.js'
import {setDataProperty} from '#packages/ecma262-abstract/intrinsics.js'

interface Part<T extends string, V> {
  type: T
  value: V
}

// Single-value parts expose only type and value.
export function CreatePartsArray<T extends string, V>(
  parts: readonly Part<T, V>[]
): Part<T, V>[] {
  const result = ArrayCreate<Part<T, V>>(0)
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index]
    setDataProperty(result, `${index}`, {type: part.type, value: part.value})
  }
  return result
}
