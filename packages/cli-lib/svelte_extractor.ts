import {parse} from 'svelte/compiler'

export type ScriptParseFn = (source: string) => void

interface SvelteNode {
  type: string
  start: number
  end: number
  [key: string]: any
}

const MESSAGE_DESCRIPTOR_PROPS = new Set([
  'id',
  'defaultMessage',
  'description',
])

function isValidIdentifier(name: string): boolean {
  return /^[$A-Z_a-z][$\w]*$/.test(name)
}

function walkFragment(
  fragment: SvelteNode | null | undefined,
  source: string,
  parseScriptFn: ScriptParseFn
): void {
  if (!fragment || !fragment.nodes) {
    return
  }
  for (const node of fragment.nodes) {
    walkNode(node, source, parseScriptFn)
  }
}

function extractExpression(
  expression: SvelteNode | null | undefined,
  source: string,
  parseScriptFn: ScriptParseFn
): void {
  if (!expression || expression.start == null || expression.end == null) {
    return
  }
  const content = source.slice(expression.start, expression.end)
  try {
    parseScriptFn(`(${content})`)
  } catch (e) {
    console.warn(
      `Failed to parse "${content}". Ignore this if content has no extractable message`,
      e
    )
  }
}

function getStringAttributeValue(value: SvelteNode): string {
  return value.data ?? value.raw ?? ''
}

function getAttributeExpression(
  attr: SvelteNode,
  source: string
): string | undefined {
  if (attr.value === true || attr.value == null) {
    return undefined
  }

  if (!Array.isArray(attr.value)) {
    if (attr.value.type === 'ExpressionTag') {
      return source.slice(
        attr.value.expression.start,
        attr.value.expression.end
      )
    }
    return undefined
  }

  if (!attr.value.length) {
    return '""'
  }

  if (attr.value.length === 1) {
    const [value] = attr.value
    if (value.type === 'ExpressionTag') {
      return source.slice(value.expression.start, value.expression.end)
    }
    return JSON.stringify(getStringAttributeValue(value))
  }

  let staticValue = ''
  for (const value of attr.value) {
    if (value.type === 'ExpressionTag') {
      return undefined
    }
    staticValue += getStringAttributeValue(value)
  }
  return JSON.stringify(staticValue)
}

function extractMessageComponent(
  node: SvelteNode,
  source: string,
  parseScriptFn: ScriptParseFn
): void {
  if (typeof node.name !== 'string' || !isValidIdentifier(node.name)) {
    return
  }

  const props: string[] = []
  for (const attr of node.attributes || []) {
    if (
      attr.type !== 'Attribute' ||
      typeof attr.name !== 'string' ||
      !MESSAGE_DESCRIPTOR_PROPS.has(attr.name)
    ) {
      continue
    }

    const expression = getAttributeExpression(attr, source)
    if (expression != null) {
      props.push(`${attr.name}: ${expression}`)
    }
  }

  if (!props.length) {
    return
  }

  try {
    parseScriptFn(`${node.name}({${props.join(', ')}})`)
  } catch (e) {
    console.warn(
      `Failed to parse ${node.name} message component. Ignore this if component has no extractable message`,
      e
    )
  }
}

function walkNode(
  node: SvelteNode,
  source: string,
  parseScriptFn: ScriptParseFn
): void {
  switch (node.type) {
    case 'ExpressionTag':
      extractExpression(node.expression, source, parseScriptFn)
      break

    case 'ConstTag':
      // {@const x = expr} — the declaration contains the expression
      if (node.declaration) {
        const content = source.slice(
          node.declaration.start,
          node.declaration.end
        )
        try {
          parseScriptFn(content)
        } catch (e) {
          console.warn(
            `Failed to parse const declaration. Ignore this if content has no extractable message`,
            e
          )
        }
      }
      break

    case 'IfBlock':
      extractExpression(node.test, source, parseScriptFn)
      walkFragment(node.consequent, source, parseScriptFn)
      walkFragment(node.alternate, source, parseScriptFn)
      break

    case 'EachBlock':
      extractExpression(node.expression, source, parseScriptFn)
      if (node.key) {
        extractExpression(node.key, source, parseScriptFn)
      }
      walkFragment(node.body, source, parseScriptFn)
      walkFragment(node.fallback, source, parseScriptFn)
      break

    case 'AwaitBlock':
      extractExpression(node.expression, source, parseScriptFn)
      walkFragment(node.pending, source, parseScriptFn)
      walkFragment(node.then, source, parseScriptFn)
      walkFragment(node.catch, source, parseScriptFn)
      break

    case 'KeyBlock':
      extractExpression(node.expression, source, parseScriptFn)
      walkFragment(node.fragment, source, parseScriptFn)
      break

    case 'SnippetBlock':
      walkFragment(node.body, source, parseScriptFn)
      break

    case 'RegularElement':
    case 'Component':
    case 'SvelteComponent':
    case 'SvelteElement':
    case 'SvelteHead':
    case 'SvelteBody':
    case 'SvelteWindow':
    case 'SvelteDocument':
    case 'SlotElement':
    case 'SvelteSelf':
    case 'SvelteFragment':
      if (node.type === 'Component') {
        extractMessageComponent(node, source, parseScriptFn)
      }
      // Process attributes
      if (node.attributes) {
        for (const attr of node.attributes) {
          if (attr.type === 'Attribute') {
            if (Array.isArray(attr.value)) {
              for (const v of attr.value) {
                if (v.type === 'ExpressionTag') {
                  extractExpression(v.expression, source, parseScriptFn)
                }
              }
            } else if (
              typeof attr.value === 'object' &&
              attr.value !== null &&
              attr.value.type === 'ExpressionTag'
            ) {
              extractExpression(attr.value.expression, source, parseScriptFn)
            }
          } else if (attr.type === 'SpreadAttribute') {
            extractExpression(attr.expression, source, parseScriptFn)
          } else if (attr.expression) {
            // Directive nodes (OnDirective, BindDirective, etc.)
            extractExpression(attr.expression, source, parseScriptFn)
          }
        }
      }
      // Process children
      walkFragment(node.fragment, source, parseScriptFn)
      break
  }
}

export function parseFile(
  source: string,
  filename: string,
  parseScriptFn: ScriptParseFn
): void {
  const ast = parse(source, {modern: true, filename})

  // Walk the template fragment
  walkFragment(ast.fragment as unknown as SvelteNode, source, parseScriptFn)

  // Process <script> block
  if (ast.instance) {
    const program = ast.instance.content as unknown as SvelteNode
    parseScriptFn(source.slice(program.start, program.end))
  }

  // Process <script context="module"> / <script module> block
  if (ast.module) {
    const program = ast.module.content as unknown as SvelteNode
    parseScriptFn(source.slice(program.start, program.end))
  }
}
