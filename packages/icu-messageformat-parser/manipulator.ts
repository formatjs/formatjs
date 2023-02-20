import {
  isPluralElement,
  isSelectElement,
  isTagElement,
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
