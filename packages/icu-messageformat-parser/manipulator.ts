import {
  isArgumentElement,
  isDateElement,
  isNumberElement,
  isPluralElement,
  isPoundElement,
  isSelectElement,
  isTagElement,
  isTimeElement,
  type MessageFormatElement,
  type PluralElement,
  type SelectElement,
  TYPE,
} from '#packages/icu-messageformat-parser/types.js'

function mapValues<T, U>(
  obj: Record<string, T>,
  map: (value: T) => U
): Record<string, U> {
  const result: Record<string, U> = {}
  for (const key of Object.keys(obj)) {
    Object.defineProperty(result, key, {
      value: map(obj[key]),
      enumerable: true,
      configurable: true,
      writable: true,
    })
  }
  return result
}

function cloneDeep<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(cloneDeep) as T
  }
  if (obj !== null && typeof obj === 'object') {
    return mapValues(obj as Record<string, unknown>, cloneDeep) as T
  }
  return obj
}

function replacePoundWithArgument(
  ast: MessageFormatElement[],
  variableName: string
): MessageFormatElement[] {
  return ast.map(el => {
    if (isPoundElement(el)) {
      // Replace # with {variableName, number}
      return {
        type: TYPE.number,
        value: variableName,
        style: null,
        location: el.location,
      }
    }
    if (isTagElement(el)) {
      return {
        ...el,
        children: replacePoundWithArgument(el.children, variableName),
      }
    }
    return el
  })
}

function hasPound(ast: MessageFormatElement[]): boolean {
  return ast.some(
    el => isPoundElement(el) || (isTagElement(el) && hasPound(el.children))
  )
}

function hoistPluralOrSelectElement(
  ast: MessageFormatElement[],
  el: PluralElement | SelectElement,
  positionToInject: number,
  parentPlural?: PluralElement
) {
  const cloned = cloneDeep(el)
  let before = ast.slice(0, positionToInject)
  let after = ast.slice(positionToInject + 1)
  if (parentPlural) {
    before = replacePoundWithArgument(before, parentPlural.value)
    after = replacePoundWithArgument(after, parentPlural.value)
  }
  cloned.options = mapValues(cloned.options, option => ({
    ...option,
    value: hoistSelectorsInContext(
      [...before, ...option.value, ...after],
      isPluralElement(cloned) ? cloned : undefined
    ),
  }))
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
  return hoistSelectorsInContext(ast)
}

function hoistSelectorsInContext(
  ast: MessageFormatElement[],
  parentPlural?: PluralElement
): MessageFormatElement[] {
  for (const el of ast) {
    if (isTagElement(el) && findPluralOrSelectElement([el])) {
      throw new Error(
        'Cannot hoist plural/select within a tag element. Please put the tag element inside each plural/select option'
      )
    }
  }
  for (let i = 0; i < ast.length; i++) {
    const el = ast[i]
    if (!isPluralOrSelectElement(el)) continue
    if (
      parentPlural?.offset &&
      (hasPound(ast.slice(0, i)) || hasPound(ast.slice(i + 1)))
    ) {
      // Offset pounds need their original plural scope; ICU has no subtraction argument.
      return ast.map(node => {
        if (!isPluralOrSelectElement(node)) return node
        const options = mapValues(node.options, option => ({
          ...option,
          value: hoistSelectorsInContext(
            option.value,
            isPluralElement(node) ? node : undefined
          ),
        }))
        return {...node, options}
      })
    }
    return [hoistPluralOrSelectElement(ast, el, i, parentPlural)]
  }
  return ast
}

/**
 * Collect variable types, allowing shared date/time arguments.
 * @param ast AST to collect variables from
 * @param vars Map of variable names to type sets
 */
function collectVariables(
  ast: MessageFormatElement[],
  vars: Map<string, Set<TYPE>> = new Map()
): void {
  ast.forEach(el => {
    if (
      isArgumentElement(el) ||
      isDateElement(el) ||
      isTimeElement(el) ||
      isNumberElement(el)
    ) {
      // If the variable was already registered as a plural/select, it's normal
      // for it to also appear inside as number/date/time/argument — not a conflict.
      if (vars.has(el.value)) {
        const existingTypes = vars.get(el.value)!
        if (
          !existingTypes.has(el.type) &&
          !existingTypes.has(TYPE.plural) &&
          !existingTypes.has(TYPE.select)
        ) {
          if (
            (el.type === TYPE.date || el.type === TYPE.time) &&
            Array.from(existingTypes).every(
              type => type === TYPE.date || type === TYPE.time
            )
          ) {
            existingTypes.add(el.type)
          } else {
            throw new Error(`Variable ${el.value} has conflicting types`)
          }
        }
      } else {
        vars.set(el.value, new Set([el.type]))
      }
    }

    if (isPluralElement(el) || isSelectElement(el)) {
      vars.set(el.value, new Set([el.type]))
      Object.keys(el.options).forEach(k => {
        collectVariables(el.options[k].value, vars)
      })
    }

    if (isTagElement(el)) {
      vars.set(el.value, new Set([el.type]))
      collectVariables(el.children, vars)
    }
  })
}

interface IsStructurallySameResult {
  error?: Error
  success: boolean
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
): IsStructurallySameResult {
  const aVars = new Map<string, Set<TYPE>>()
  const bVars = new Map<string, Set<TYPE>>()
  collectVariables(a, aVars)
  collectVariables(b, bVars)

  if (aVars.size !== bVars.size) {
    return {
      success: false,
      error: new Error(
        `Different number of variables: [${Array.from(aVars.keys()).join(', ')}] vs [${Array.from(bVars.keys()).join(', ')}]`
      ),
    }
  }

  return Array.from(aVars.entries()).reduce<IsStructurallySameResult>(
    (result, [key, type]) => {
      if (!result.success) {
        return result
      }
      const bType = bVars.get(key)
      if (bType == null) {
        return {
          success: false,
          error: new Error(`Missing variable ${key} in message`),
        }
      }
      if (
        bType.size !== type.size ||
        !Array.from(type).every(t => bType.has(t))
      ) {
        return {
          success: false,
          error: new Error(
            `Variable ${key} has conflicting types: ${Array.from(type, t => TYPE[t]).join(', ')} vs ${Array.from(bType, t => TYPE[t]).join(', ')}`
          ),
        }
      }
      return result
    },
    {success: true}
  )
}
