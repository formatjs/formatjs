import {parse} from '@vue/compiler-sfc'
import type {
  TemplateChildNode,
  SimpleExpressionNode,
  ElementNode,
  InterpolationNode,
  CompoundExpressionNode,
  DirectiveNode,
} from '@vue/compiler-core'

// Duplicate `NodeTypes` here because they are defined as
// const enum, which does not work with swc transpilation: https://github.com/vuejs/core/issues/1228
const ELEMENT = 1 as const
const SIMPLE_EXPRESSION = 4 as const
const INTERPOLATION = 5 as const
const DIRECTIVE = 7 as const
const COMPOUND_EXPRESSION = 8 as const

export type ScriptParseFn = (source: string) => void

function walk(
  node: TemplateChildNode | CompoundExpressionNode['children'][0],
  visitor: (
    node:
      | ElementNode
      | InterpolationNode
      | CompoundExpressionNode
      | SimpleExpressionNode
  ) => void
) {
  if (typeof node !== 'object') {
    return
  }
  if (
    node.type !== ELEMENT &&
    node.type !== COMPOUND_EXPRESSION &&
    node.type !== INTERPOLATION
  ) {
    return
  }
  visitor(node)
  if (node.type === INTERPOLATION) {
    visitor(node.content)
  } else if (node.type === ELEMENT) {
    node.children.forEach(n => walk(n, visitor))
    node.props
      .filter((prop): prop is DirectiveNode => prop.type === DIRECTIVE)
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
    if (n.type !== SIMPLE_EXPRESSION) {
      return
    }

    const {content} = n as SimpleExpressionNode
    // Wrap this in () since a vue comp node attribute can just be
    // an object literal which, by itself is invalid TS
    // but with () it becomes an ExpressionStatement
    parseScriptFn(`(${content})`)
  }
}

export function parseFile(
  source: string,
  filename: string,
  parseScriptFn: ScriptParseFn
): any {
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
