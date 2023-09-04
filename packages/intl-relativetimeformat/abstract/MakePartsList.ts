import {invariant, PartitionPattern} from '@formatjs/ecma402-abstract'

export function MakePartsList(
  pattern: string,
  unit: Intl.RelativeTimeFormatUnitSingular,
  parts: Intl.NumberFormatPart[] | Intl.RelativeTimeFormatPart[]
) {
  const patternParts = PartitionPattern(pattern)
  const result: Intl.RelativeTimeFormatPart[] = []
  for (const patternPart of patternParts) {
    if (patternPart.type === 'literal') {
      result.push({
        type: 'literal',
        value: patternPart.value!,
      })
    } else {
      invariant(patternPart.type === '0', `Malformed pattern ${pattern}`)
      for (const part of parts) {
        result.push({
          type: part.type,
          value: part.value,
          unit,
        })
      }
    }
  }
  return result
}
