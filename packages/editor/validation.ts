import {
  isLiteralElement,
  isPluralElement,
  isPoundElement,
  isSelectElement,
  isTagElement,
  parse,
  type MessageFormatElement,
} from '@formatjs/icu-messageformat-parser'

export type TranslationValidationError =
  | 'empty'
  | 'invalid-source'
  | 'invalid-translation'
  | 'structure'

function group(
  elements: MessageFormatElement[]
): Map<string, MessageFormatElement[]> {
  const groups = new Map<string, MessageFormatElement[]>()
  for (const element of elements) {
    if (isLiteralElement(element) || isPoundElement(element)) continue
    const key = JSON.stringify([
      element.type,
      element.value,
      'style' in element ? element.style : null,
    ])
    groups.set(key, [...(groups.get(key) ?? []), element])
  }
  return groups
}

function compatibleElement(
  source: MessageFormatElement,
  target: MessageFormatElement
): boolean {
  if (isTagElement(source) && isTagElement(target))
    return compatible(source.children, target.children)
  if (isSelectElement(source) && isSelectElement(target)) {
    const keys = Object.keys(source.options)
    return (
      keys.length === Object.keys(target.options).length &&
      keys.every(
        key =>
          target.options[key] &&
          compatible(source.options[key].value, target.options[key].value)
      )
    )
  }
  if (isPluralElement(source) && isPluralElement(target)) {
    if (
      source.offset !== target.offset ||
      source.pluralType !== target.pluralType
    )
      return false
    const exactKeys = (element: typeof source): string =>
      Object.keys(element.options)
        .filter(key => key.startsWith('='))
        .sort()
        .join(',')
    if (exactKeys(source) !== exactKeys(target)) return false
    // New locale categories inherit the source's fallback contract.
    return Object.entries(target.options).every(([key, option]) =>
      compatible(
        (source.options[key] ?? source.options.other).value,
        option.value
      )
    )
  }
  return true
}

function compatible(
  source: MessageFormatElement[],
  target: MessageFormatElement[]
): boolean {
  const sourceGroups = group(source)
  const targetGroups = group(target)
  if (sourceGroups.size !== targetGroups.size) return false
  return [...targetGroups].every(([key, elements]) => {
    const originals = sourceGroups.get(key)
    return (
      originals !== undefined &&
      elements.every(element =>
        originals.some(original => compatibleElement(original, element))
      ) &&
      originals.every(original =>
        elements.some(element => compatibleElement(original, element))
      )
    )
  })
}

/** Returns a stable error code; consumers own localized error copy. */
export function validateTranslation(
  source: string,
  translation: string
): TranslationValidationError | null {
  if (!translation.trim()) return 'empty'
  let sourceAst: MessageFormatElement[]
  let translationAst: MessageFormatElement[]
  try {
    sourceAst = parse(source)
  } catch {
    return 'invalid-source'
  }
  try {
    translationAst = parse(translation)
  } catch {
    return 'invalid-translation'
  }
  return compatible(sourceAst, translationAst) ? null : 'structure'
}
