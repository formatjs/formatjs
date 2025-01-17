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
  MessageFormatElement,
  PluralElement,
  PluralOrSelectOption,
  SelectElement,
} from './types'

function cloneDeep<T>(obj: T): T {
  if (Array.isArray(obj)) {
    // @ts-expect-error meh
    return [...obj.map(cloneDeep)]
  }
  if (obj !== null && typeof obj === 'object') {
    // @ts-expect-error meh
    return Object.keys(obj).reduce((cloned, k) => {
      // @ts-expect-error meh
      cloned[k] = cloneDeep(obj[k])
      return cloned
    }, {})
  }
  return obj
}

function hoistPluralOrSelectElement(
  ast: MessageFormatElement[],
  el: PluralElement | SelectElement,
  positionToInject: number
) {
  // pull this out of the ast and move it to the top
  const cloned = cloneDeep(el)
  const {options} = cloned
  cloned.options = Object.keys(options).reduce(
    (all: Record<string, PluralOrSelectOption>, k) => {
      const newValue = hoistSelectors([
        ...ast.slice(0, positionToInject),
        ...options[k].value,
        ...ast.slice(positionToInject + 1),
      ])
      all[k] = {
        value: newValue,
      }
      return all
    },
    {}
  )
  return cloned
}

function isPluralOrSelectElement(
  el: MessageFormatElement
): el is PluralElement | SelectElement {
  return isPluralElement(el) || isSelectElement(el)
}

function findPluralOrSelectElement(ast: MessageFormatElement[]): boolean {
  return !!ast.find(el => {
    if (isPluralOrSelectElement(el)) {
      return true
    }
    if (isTagElement(el)) {
      return findPluralOrSelectElement(el.children)
    }
    return false
  })
}

/**
 * Hoist all selectors to the beginning of the AST & flatten the
 * resulting options. E.g:
 * "I have {count, plural, one{a dog} other{many dogs}}"
 * becomes "{count, plural, one{I have a dog} other{I have many dogs}}".
 * If there are multiple selectors, the order of which one is hoisted 1st
 * is non-deterministic.
 * The goal is to provide as many full sentences as possible since fragmented
 * sentences are not translator-friendly
 * @param ast AST
 */
export function hoistSelectors(
  ast: MessageFormatElement[]
): MessageFormatElement[] {
  for (let i = 0; i < ast.length; i++) {
    const el = ast[i]
    if (isPluralOrSelectElement(el)) {
      return [hoistPluralOrSelectElement(ast, el, i)]
    }
    if (isTagElement(el) && findPluralOrSelectElement([el])) {
      throw new Error(
        'Cannot hoist plural/select within a tag element. Please put the tag element inside each plural/select option'
      )
    }
  }
  return ast
}

function isStructurallySamePluralOrSelect(
  el1: PluralElement | SelectElement,
  el2: PluralElement | SelectElement
): boolean {
  const options1 = el1.options
  const options2 = el2.options
  if (Object.keys(options1).length !== Object.keys(options2).length) {
    return false
  }
  for (const key in options1) {
    if (!options2[key]) {
      return false
    }
    if (!isStructurallySame(options1[key].value, options2[key].value)) {
      return false
    }
  }
  return true
}

export function isStructurallySame(
  a: MessageFormatElement[],
  b: MessageFormatElement[]
): boolean {
  const aWithoutLiteral = a.filter(el => !isLiteralElement(el))
  const bWithoutLiteral = b.filter(el => !isLiteralElement(el))
  if (aWithoutLiteral.length !== bWithoutLiteral.length) {
    return false
  }

  const elementsMapInA = aWithoutLiteral.reduce<
    Record<string, MessageFormatElement>
  >((all, el) => {
    if (isPoundElement(el)) {
      all['#'] = el
      return all
    }
    all[el.value] = el
    return all
  }, {})

  const elementsMapInB = bWithoutLiteral.reduce<
    Record<string, MessageFormatElement>
  >((all, el) => {
    if (isPoundElement(el)) {
      all['#'] = el
      return all
    }
    all[el.value] = el
    return all
  }, {})

  for (const varName of Object.keys(elementsMapInA)) {
    const elA = elementsMapInA[varName]
    const elB = elementsMapInB[varName]
    if (!elB) {
      return false
    }

    if (elA.type !== elB.type) {
      return false
    }

    if (isLiteralElement(elA) || isLiteralElement(elB)) {
      continue
    }

    if (
      isArgumentElement(elA) &&
      isArgumentElement(elB) &&
      elA.value !== elB.value
    ) {
      return false
    }

    if (isPoundElement(elA) || isPoundElement(elB)) {
      continue
    }

    if (
      isDateElement(elA) ||
      isTimeElement(elA) ||
      isNumberElement(elA) ||
      isDateElement(elB) ||
      isTimeElement(elB) ||
      isNumberElement(elB)
    ) {
      if (elA.value !== elB.value) {
        return false
      }
    }

    if (
      isPluralElement(elA) &&
      isPluralElement(elB) &&
      !isStructurallySamePluralOrSelect(elA, elB)
    ) {
      return false
    }

    if (
      isSelectElement(elA) &&
      isSelectElement(elB) &&
      isStructurallySamePluralOrSelect(elA, elB)
    ) {
      return false
    }

    if (isTagElement(elA) && isTagElement(elB)) {
      if (elA.value !== elB.value) {
        return false
      }
      if (!isStructurallySame(elA.children, elB.children)) {
        return false
      }
    }
  }
  return true
}
