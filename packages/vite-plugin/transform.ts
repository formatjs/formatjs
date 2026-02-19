import {parseSync} from 'oxc-parser'
import MagicString from 'magic-string'
import {interpolateName} from '@formatjs/ts-transformer'
import {parse} from '@formatjs/icu-messageformat-parser'

export interface Options {
  overrideIdFn?: (
    id: string | undefined,
    defaultMessage: string | undefined,
    description: string | undefined,
    filePath: string
  ) => string
  idInterpolationPattern?: string
  removeDefaultMessage?: boolean
  additionalComponentNames?: string[]
  additionalFunctionNames?: string[]
  ast?: boolean
  preserveWhitespace?: boolean
}

const DEFAULT_ID_INTERPOLATION_PATTERN = '[sha512:contenthash:base64:6]'

interface MessageDescriptor {
  id?: string
  defaultMessage?: string
  description?: string
}

interface DescriptorLocation {
  id?: {start: number; end: number; value: string}
  defaultMessage?: {start: number; end: number; value: string}
  description?: {start: number; end: number; value: string}
  /** Position right after the opening `{` or element name — stable insertion point for `id` */
  insertionPoint?: number
}

export function transform(
  code: string,
  id: string,
  options: Options
): {code: string; map: ReturnType<MagicString['generateMap']>} | undefined {
  const {
    overrideIdFn,
    idInterpolationPattern = DEFAULT_ID_INTERPOLATION_PATTERN,
    removeDefaultMessage = false,
    additionalComponentNames = [],
    additionalFunctionNames = [],
    ast: preParseAst = false,
    preserveWhitespace = false,
  } = options

  const componentNames = new Set([
    'FormattedMessage',
    ...additionalComponentNames,
  ])
  const functionNames = new Set([
    'formatMessage',
    '$t',
    '$formatMessage',
    'defineMessage',
    'defineMessages',
    ...additionalFunctionNames,
  ])
  // Compiled JSX runtime functions: _jsx(Component, props), React.createElement(Component, props)
  const jsxRuntimeFunctions = new Set([
    'jsx',
    '_jsx',
    'jsxs',
    '_jsxs',
    'jsxDEV',
    '_jsxDEV',
    'createElement',
  ])

  const result = parseSync(id, code, {sourceType: 'module'})
  const program = result.program

  let s: MagicString | undefined

  function getStaticValue(node: any): string | undefined {
    if (!node) return undefined
    if (node.type === 'StringLiteral' || node.type === 'Literal') {
      if (typeof node.value === 'string') return node.value
      return undefined
    }
    if (node.type === 'TemplateLiteral') {
      if (node.quasis.length === 1 && node.expressions.length === 0) {
        return node.quasis[0].value.cooked ?? node.quasis[0].value.raw
      }
      return undefined
    }
    if (node.type === 'BinaryExpression' && node.operator === '+') {
      const left = getStaticValue(node.left)
      const right = getStaticValue(node.right)
      if (left !== undefined && right !== undefined) return left + right
      return undefined
    }
    return undefined
  }

  function extractDescriptor(
    objNode: any
  ):
    | {descriptor: MessageDescriptor; locations: DescriptorLocation}
    | undefined {
    const properties = objNode.properties
    const descriptor: MessageDescriptor = {}
    const locations: DescriptorLocation = {}

    // Use the position right after `{` as a stable insertion point
    locations.insertionPoint = objNode.start + 1

    for (const prop of properties) {
      if (prop.type !== 'Property' && prop.type !== 'ObjectProperty') continue
      const key = prop.key
      let name: string | undefined
      if (key.type === 'Identifier') name = key.name
      else if (key.type === 'StringLiteral' || key.type === 'Literal') {
        name = key.value as string
      }
      if (!name) continue
      if (name !== 'id' && name !== 'defaultMessage' && name !== 'description')
        continue
      const keyName: keyof MessageDescriptor = name

      const val = getStaticValue(prop.value)
      if (val === undefined) continue

      descriptor[keyName] = val
      locations[keyName] = {
        start: prop.value.start,
        end: prop.value.end,
        value: val,
      }
    }

    if (!descriptor.defaultMessage && !descriptor.id) return undefined
    return {descriptor, locations}
  }

  function extractJSXDescriptor(
    elementNode: any
  ):
    | {descriptor: MessageDescriptor; locations: DescriptorLocation}
    | undefined {
    const attributes = elementNode.attributes || []
    const descriptor: MessageDescriptor = {}
    const locations: DescriptorLocation = {}

    // Use the position right after the element name as the insertion point
    // Find the first attribute start, or use the end of the element name
    const firstAttr = attributes[0]
    locations.insertionPoint = firstAttr
      ? firstAttr.start
      : elementNode.name.end

    for (const attr of attributes) {
      if (attr.type !== 'JSXAttribute') continue
      const attrName = attr.name
      if (!attrName || attrName.type !== 'JSXIdentifier') continue
      const n = attrName.name
      if (n !== 'id' && n !== 'defaultMessage' && n !== 'description') continue
      const keyName: keyof MessageDescriptor = n

      let val: string | undefined
      const valueNode = attr.value
      if (!valueNode) continue

      if (valueNode.type === 'StringLiteral' || valueNode.type === 'Literal') {
        val = valueNode.value as string
      } else if (valueNode.type === 'JSXExpressionContainer') {
        val = getStaticValue(valueNode.expression)
      }

      if (val === undefined) continue

      descriptor[keyName] = val
      locations[keyName] = {
        start: attr.value.start,
        end: attr.value.end,
        value: val,
      }
    }

    if (!descriptor.defaultMessage && !descriptor.id) return undefined
    return {descriptor, locations}
  }

  function processDescriptor(
    descriptor: MessageDescriptor,
    locations: DescriptorLocation,
    isJSX: boolean
  ): void {
    let {defaultMessage, description} = descriptor
    let existingId = descriptor.id

    // Normalize whitespace on defaultMessage
    if (defaultMessage && !preserveWhitespace) {
      defaultMessage = defaultMessage.trim().replace(/\s+/gm, ' ')
    }

    // Generate ID
    let newId = existingId
    if (overrideIdFn) {
      newId = overrideIdFn(existingId, defaultMessage, description, id)
    } else if (!existingId && idInterpolationPattern && defaultMessage) {
      newId = interpolateName(
        {resourcePath: id} as any,
        idInterpolationPattern,
        {
          content: description
            ? `${defaultMessage}#${description}`
            : defaultMessage,
        }
      )
    }

    if (!newId && !defaultMessage) return

    if (!s) s = new MagicString(code)

    // Insert/update id
    if (newId) {
      if (locations.id) {
        // Replace existing id value
        s.overwrite(locations.id.start, locations.id.end, JSON.stringify(newId))
      } else if (locations.insertionPoint != null) {
        // Insert id at a stable position (after `{` for objects, before first attr for JSX)
        if (isJSX) {
          s.appendLeft(locations.insertionPoint, `id=${JSON.stringify(newId)} `)
        } else {
          s.appendRight(
            locations.insertionPoint,
            `id: ${JSON.stringify(newId)}, `
          )
        }
      }
    }

    // Remove description
    if (locations.description) {
      if (isJSX) {
        // For JSX, we need to remove the whole attribute including the key
        // Find the JSX attribute that contains this value
        removeJSXAttribute(locations.description)
      } else {
        removeObjectProperty(locations.description)
      }
    }

    // Handle defaultMessage
    if (locations.defaultMessage) {
      if (removeDefaultMessage) {
        if (isJSX) {
          removeJSXAttribute(locations.defaultMessage)
        } else {
          removeObjectProperty(locations.defaultMessage)
        }
      } else if (defaultMessage) {
        if (preParseAst) {
          const parsed = parse(defaultMessage)
          s.overwrite(
            locations.defaultMessage.start,
            locations.defaultMessage.end,
            JSON.stringify(parsed)
          )
        } else if (defaultMessage !== locations.defaultMessage.value) {
          // Whitespace was normalized, update the value
          s.overwrite(
            locations.defaultMessage.start,
            locations.defaultMessage.end,
            JSON.stringify(defaultMessage)
          )
        }
      }
    }
  }

  function removeObjectProperty(loc: {start: number; end: number}): void {
    if (!s) return
    // Find the property boundaries: walk back to find key start, walk forward past trailing comma
    let propStart = loc.start
    // Walk backward past value, colon, key, and any whitespace
    let i = loc.start - 1
    while (
      i >= 0 &&
      (code[i] === ' ' ||
        code[i] === '\t' ||
        code[i] === '\n' ||
        code[i] === '\r')
    )
      i--
    // Skip colon
    if (i >= 0 && code[i] === ':') i--
    while (
      i >= 0 &&
      (code[i] === ' ' ||
        code[i] === '\t' ||
        code[i] === '\n' ||
        code[i] === '\r')
    )
      i--
    // Walk backward through key (identifier or string literal)
    if (i >= 0 && (code[i] === '"' || code[i] === "'")) {
      const quote = code[i]
      i--
      while (i >= 0 && code[i] !== quote) i--
      if (i >= 0) i-- // skip opening quote
    } else {
      while (i >= 0 && /[a-zA-Z0-9_$]/.test(code[i])) i--
    }
    propStart = i + 1

    let propEnd = loc.end
    // Walk forward past trailing comma and whitespace
    let j = loc.end
    while (j < code.length && (code[j] === ' ' || code[j] === '\t')) j++
    if (j < code.length && code[j] === ',') {
      j++
      // Also skip whitespace after comma
      while (j < code.length && (code[j] === ' ' || code[j] === '\t')) j++
      // Skip one newline
      if (j < code.length && code[j] === '\n') j++
      else if (j < code.length && code[j] === '\r') {
        j++
        if (j < code.length && code[j] === '\n') j++
      }
    }
    propEnd = j

    // Also remove leading whitespace/newline
    let k = propStart - 1
    while (k >= 0 && (code[k] === ' ' || code[k] === '\t')) k--
    if (k >= 0 && (code[k] === '\n' || code[k] === ',')) {
      propStart = k + 1
    }

    s.remove(propStart, propEnd)
  }

  function removeJSXAttribute(loc: {start: number; end: number}): void {
    if (!s) return
    // Walk backward from the value to find attribute name
    let i = loc.start - 1
    // Skip the `=`
    if (i >= 0 && code[i] === '=') i--
    // Walk backward through attribute name
    while (i >= 0 && /[a-zA-Z0-9_$]/.test(code[i])) i--
    const attrStart = i + 1

    let attrEnd = loc.end
    // Skip trailing whitespace
    let j = attrEnd
    while (j < code.length && (code[j] === ' ' || code[j] === '\t')) j++
    attrEnd = j

    // Also remove leading whitespace
    let k = attrStart - 1
    while (k >= 0 && (code[k] === ' ' || code[k] === '\t')) k--
    const removeStart = k + 1

    s.remove(removeStart, attrEnd)
  }

  function getCalleeName(node: any): string | undefined {
    if (node.type === 'Identifier') return node.name
    if (
      node.type === 'MemberExpression' ||
      node.type === 'OptionalMemberExpression'
    ) {
      if (node.property?.type === 'Identifier') return node.property.name
    }
    return undefined
  }

  function walk(node: any): void {
    if (!node || typeof node !== 'object') return

    if (
      node.type === 'CallExpression' ||
      node.type === 'OptionalCallExpression'
    ) {
      const calleeName = getCalleeName(node.callee)

      // Handle compiled JSX: _jsx(FormattedMessage, { id, description, defaultMessage })
      if (calleeName && jsxRuntimeFunctions.has(calleeName)) {
        const firstArg = node.arguments?.[0]
        const componentName =
          firstArg?.type === 'Identifier' ? firstArg.name : undefined
        if (componentName && componentNames.has(componentName)) {
          const propsArg = node.arguments?.[1]
          if (propsArg?.type === 'ObjectExpression') {
            const result = extractDescriptor(propsArg)
            if (result) {
              processDescriptor(result.descriptor, result.locations, false)
            }
          }
        }
      }

      if (calleeName && functionNames.has(calleeName)) {
        if (calleeName === 'defineMessages') {
          // Process each value in the object
          const arg = node.arguments?.[0]
          if (arg?.type === 'ObjectExpression') {
            for (const prop of arg.properties) {
              if (
                (prop.type === 'Property' || prop.type === 'ObjectProperty') &&
                prop.value?.type === 'ObjectExpression'
              ) {
                const result = extractDescriptor(prop.value)
                if (result) {
                  processDescriptor(result.descriptor, result.locations, false)
                }
              }
            }
          }
        } else if (
          calleeName === 'defineMessage' ||
          calleeName === 'formatMessage' ||
          calleeName === '$t' ||
          calleeName === '$formatMessage' ||
          functionNames.has(calleeName)
        ) {
          const arg = node.arguments?.[0]
          if (arg?.type === 'ObjectExpression') {
            const result = extractDescriptor(arg)
            if (result) {
              processDescriptor(result.descriptor, result.locations, false)
            }
          }
        }
      }
    }

    if (node.type === 'JSXOpeningElement') {
      const name =
        node.name?.type === 'JSXIdentifier' ? node.name.name : undefined
      if (name && componentNames.has(name)) {
        const result = extractJSXDescriptor(node)
        if (result) {
          processDescriptor(result.descriptor, result.locations, true)
        }
      }
    }

    // Walk children
    for (const key of Object.keys(node)) {
      if (key === 'start' || key === 'end' || key === 'type') continue
      const child = node[key]
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === 'object' && item.type) {
            walk(item)
          }
        }
      } else if (child && typeof child === 'object' && child.type) {
        walk(child)
      }
    }
  }

  walk(program)

  if (!s) return undefined

  return {
    code: s.toString(),
    map: s.generateMap({hires: true}),
  }
}
