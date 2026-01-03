import {
  NodeTypes,
  type TextNode,
  type CompoundExpressionNode,
  type DirectiveNode,
  type ElementNode,
  type InterpolationNode,
  type RootNode,
  type SimpleExpressionNode,
  type TemplateChildNode,
} from '@vue/compiler-core'
import {parse} from 'vue/compiler-sfc'

export type ScriptParseFn = (source: string) => void

function walk(
  node:
    | RootNode
    | TemplateChildNode
    | SimpleExpressionNode
    | CompoundExpressionNode
    | InterpolationNode
    | TextNode
    | string
    | symbol
    | undefined,
  visitor: (
    node:
      | ElementNode
      | InterpolationNode
      | CompoundExpressionNode
      | SimpleExpressionNode
  ) => void
) {
  if (typeof node !== 'object' || node == null) {
    return
  }
  if (node.type === NodeTypes.ROOT) {
    node.children.forEach(n => walk(n, visitor))
    return
  }
  if (
    node.type !== NodeTypes.ELEMENT &&
    node.type !== NodeTypes.COMPOUND_EXPRESSION &&
    node.type !== NodeTypes.INTERPOLATION
  ) {
    return
  }
  visitor(node)
  if (node.type === NodeTypes.INTERPOLATION) {
    visitor(node.content)
  } else if (node.type === NodeTypes.ELEMENT) {
    node.children.forEach(n => walk(n, visitor))
    node.props
      .filter(
        (prop): prop is DirectiveNode => prop.type === NodeTypes.DIRECTIVE
      )
      .filter(prop => !!prop.exp)
      .forEach(prop => visitor(prop.exp!))
  } else {
    node.children.forEach(n => walk(n, visitor))
  }
}

function templateSimpleExpressionNodeVisitor(parseScriptFn: ScriptParseFn) {
  return (
    n:
      | ElementNode
      | CompoundExpressionNode
      | CompoundExpressionNode['children'][0]
  ) => {
    if (typeof n !== 'object') {
      return
    }
    if (n.type !== NodeTypes.SIMPLE_EXPRESSION) {
      return
    }

    const {content} = n as SimpleExpressionNode
    // Wrap this in () since a vue comp node attribute can just be
    // an object literal which, by itself is invalid TS
    // but with () it becomes an ExpressionStatement
    try {
      parseScriptFn(`(${content})`)
    } catch (e) {
      console.warn(
        `Failed to parse "${content}". Ignore this if content has no extractable message`,
        e
      )
    }
  }
}

export function parseFile(
  source: string,
  filename: string,
  parseScriptFn: ScriptParseFn
): void {
  const {descriptor, errors} = parse(source, {
    filename,
  })
  if (errors.length) {
    throw errors[0]
  }
  const {script, scriptSetup, template} = descriptor

  if (template) {
    walk(template.ast, templateSimpleExpressionNodeVisitor(parseScriptFn))
  }

  if (script) {
    parseScriptFn(script.content)
  }

  if (scriptSetup) {
    parseScriptFn(scriptSetup.content)
  }
}
