import {setDataProperty} from '#packages/ecma262-abstract/intrinsics.js'
import {PartitionPattern} from '#packages/ecma402-abstract/PartitionPattern.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'

// ECMA-402 §18.5.3: tag substituted number parts with the singular unit.
// Own data properties also provide the fresh result required by §18.5.5.
// https://tc39.es/ecma402/#sec-makepartslist
export function MakePartsList(
  pattern: string,
  unit: Intl.RelativeTimeFormatUnitSingular,
  parts: Intl.NumberFormatPart[] | Intl.RelativeTimeFormatPart[]
): Intl.RelativeTimeFormatPart[] {
  const patternParts = PartitionPattern(pattern)
  const result: Intl.RelativeTimeFormatPart[] = []
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]
    if (patternPart.type === 'literal') {
      setDataProperty(result, result.length, {
        type: 'literal',
        value: patternPart.value!,
      })
    } else {
      invariant(patternPart.type === '0', `Malformed pattern ${pattern}`)
      for (let j = 0; j < parts.length; j++) {
        const part = parts[j]
        setDataProperty(result, result.length, {
          type: part.type,
          value: part.value,
          unit,
        })
      }
    }
  }
  return result
}
