import {parse} from '@vue/compiler-sfc';
import {
  TemplateChildNode,
  NodeTypes,
  SimpleExpressionNode,
} from '@vue/compiler-core';

export type ScriptParseFn = (source: string) => void;

function walk(node: TemplateChildNode, visitor: (node: any) => void) {
  if (
    node.type === NodeTypes.TEXT ||
    node.type === NodeTypes.COMMENT ||
    node.type === NodeTypes.IF ||
    node.type === NodeTypes.TEXT_CALL
  ) {
    return;
  }
  visitor(node);

  if (node.type === NodeTypes.INTERPOLATION) {
    visitor(node.content);
  } else {
    node.children.forEach((n: any) => walk(n, visitor));
  }
}

function templateSimpleExpressionNodeVisitor(parseScriptFn: ScriptParseFn) {
  return (n: any) => {
    if (n.type !== NodeTypes.SIMPLE_EXPRESSION) {
      return;
    }

    const {content} = n as SimpleExpressionNode;
    parseScriptFn(content);
  };
}

export function parseFile(
  source: string,
  filename: string,
  parseScriptFn: ScriptParseFn
): any {
  const {descriptor, errors} = parse(source, {
    filename,
  });
  if (errors.length) {
    throw errors[0];
  }
  const {script, template} = descriptor;

  if (template) {
    walk(template.ast, templateSimpleExpressionNodeVisitor(parseScriptFn));
  }

  if (script) {
    parseScriptFn(script.content);
  }
}
