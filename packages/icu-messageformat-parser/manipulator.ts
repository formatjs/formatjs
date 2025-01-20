import {
  isArgumentElement,
  isDateElement,
  isNumberElement,
  isPluralElement,
  isSelectElement,
  isTagElement,
  isTimeElement,
  MessageFormatElement,
  PluralElement,
  PluralOrSelectOption,
  SelectElement,
  TYPE,
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

/**
 * Collect all variables in an AST to Record<string, TYPE>
 * @param ast AST to collect variables from
 * @param vars Record of variable name to variable type
 */
function collectVariables(
  ast: MessageFormatElement[],
  vars: Map<string, TYPE> = new Map<string, TYPE>()
): void {
  ast.forEach(el => {
    if (
      isArgumentElement(el) ||
      isDateElement(el) ||
      isTimeElement(el) ||
      isNumberElement(el)
    ) {
      if (el.value in vars && vars.get(el.value) !== el.type) {
        throw new Error(`Variable ${el.value} has conflicting types`)
      }
      vars.set(el.value, el.type)
    }

    if (isPluralElement(el) || isSelectElement(el)) {
      vars.set(el.value, el.type)
      Object.keys(el.options).forEach(k => {
        collectVariables(el.options[k].value, vars)
      })
    }

    if (isTagElement(el)) {
      vars.set(el.value, el.type)
      collectVariables(el.children, vars)
    }
  })
}

/**
 * Check if 2 ASTs are structurally the same. This primarily means that
 * they have the same variables with the same type
 * @param a
 * @param b
 * @returns
 */
export function isStructurallySame(
  a: MessageFormatElement[],
  b: MessageFormatElement[]
): boolean {
  const aVars = new Map<string, TYPE>()
  const bVars = new Map<string, TYPE>()
  collectVariables(a, aVars)
  collectVariables(b, bVars)

  if (aVars.size !== bVars.size) {
    return false
  }

  return Array.from(aVars.entries()).every(([key, type]) => {
    return bVars.has(key) && bVars.get(key) === type
  })
}
