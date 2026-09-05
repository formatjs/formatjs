import {
  isArgumentElement,
  isDateElement,
  isLiteralElement,
  isNumberElement,
  isPluralElement,
  isPoundElement,
  isSelectElement,
  isTagElement,
  isTimeElement,
  parse,
} from '@formatjs/icu-messageformat-parser'
import type {MessageFormatElement} from '@formatjs/icu-messageformat-parser'

function argumentSignature(elements: MessageFormatElement[]): string[] {
  const signatures: string[] = []

  for (const element of elements) {
    if (isLiteralElement(element) || isPoundElement(element)) {
      continue
    }
    if (isArgumentElement(element)) {
      signatures.push(`${element.type}:${element.value}`)
      continue
    }
    if (
      isNumberElement(element) ||
      isDateElement(element) ||
      isTimeElement(element)
    ) {
      signatures.push(
        `${element.type}:${element.value}:${JSON.stringify(element.style ?? null)}`
      )
      continue
    }
    if (isTagElement(element)) {
      signatures.push(`${element.type}:${element.value}`)
      signatures.push(...argumentSignature(element.children))
      continue
    }
    if (isSelectElement(element) || isPluralElement(element)) {
      const selectors = Object.keys(element.options)
      const detail = isPluralElement(element)
        ? `${element.pluralType}:${element.offset}:${selectors
            .filter(selector => selector.startsWith('='))
            .sort()
            .join(',')}`
        : selectors.sort().join(',')
      signatures.push(`${element.type}:${element.value}:${detail}`)
      for (const selector of selectors) {
        signatures.push(...argumentSignature(element.options[selector].value))
      }
    }
  }

  return signatures.sort()
}

export function validateTranslation(
  source: string,
  translation: string
): string | null {
  if (!translation.trim()) {
    return 'Enter a translation before saving.'
  }

  try {
    const sourceSignature = argumentSignature(parse(source))
    const translationSignature = argumentSignature(parse(translation))
    if (
      JSON.stringify(sourceSignature) !== JSON.stringify(translationSignature)
    ) {
      return 'The translation must preserve every ICU argument, tag, plural, and selector.'
    }
  } catch (error) {
    return error instanceof Error
      ? `Invalid ICU message: ${error.message}`
      : 'Invalid ICU message.'
  }

  return null
}
