import {TSESTree, AST_NODE_TYPES} from '@typescript-eslint/typescript-estree';
import {Scope} from 'eslint';

export interface MessageDescriptor {
  id?: string;
  defaultMessage?: string;
  description?: string;
}

export interface MessageDescriptorNodeInfo {
  message: MessageDescriptor;
  messageNode?: TSESTree.Property['value'] | TSESTree.JSXAttribute['value'];
  descriptionNode?: TSESTree.Property['value'] | TSESTree.JSXAttribute['value'];
}

function isStringLiteral(node: TSESTree.Node): node is TSESTree.StringLiteral {
  return node.type === AST_NODE_TYPES.Literal && typeof node.value === 'string';
}

function findReferenceImport(
  id: TSESTree.Identifier,
  importedVars: Scope.Variable[]
) {
  return importedVars.find(
    v => !!v.references.find(ref => ref.identifier === id)
  );
}

function isIntlFormatMessageCall(node: TSESTree.Node) {
  return (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.object.type === AST_NODE_TYPES.Identifier &&
    node.callee.object.name === 'intl' &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === 'formatMessage' &&
    node.arguments.length >= 1 &&
    node.arguments[0].type === AST_NODE_TYPES.ObjectExpression
  );
}

function isSingleMessageDescriptorDeclaration(
  id: TSESTree.LeftHandSideExpression,
  importedVars: Scope.Variable[]
) {
  if (id.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }
  const importedVar = findReferenceImport(id, importedVars);
  if (!importedVar) {
    return false;
  }
  return importedVar.name === '_' || importedVar.name === 'defineMessage';
}
function isMultipleMessageDescriptorDeclaration(
  id: TSESTree.LeftHandSideExpression,
  importedVars: Scope.Variable[]
) {
  if (id.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }
  const importedVar = findReferenceImport(id, importedVars);
  if (!importedVar) {
    return false;
  }
  return importedVar.name === 'defineMessages';
}

function extractMessageDescriptor(
  node?: TSESTree.Expression
): MessageDescriptorNodeInfo | undefined {
  if (!node || node.type !== AST_NODE_TYPES.ObjectExpression) {
    return;
  }
  const result: MessageDescriptorNodeInfo = {
    message: {},
    messageNode: undefined,
    descriptionNode: undefined,
  };
  for (const prop of node.properties) {
    if (
      prop.type !== AST_NODE_TYPES.Property ||
      prop.key.type !== AST_NODE_TYPES.Identifier
    ) {
      continue;
    }
    const value = isStringLiteral(prop.value) ? prop.value.value : undefined;
    switch (prop.key.name) {
      case 'defaultMessage':
        result.messageNode = prop.value;
        result.message.defaultMessage = value;
        break;
      case 'description':
        result.descriptionNode = prop.value;
        result.message.description = value;
        break;
      case 'id':
        result.message.id = value;
        break;
    }
  }
  return result;
}

function extractMessageDescriptorFromJSXElement(
  node?: TSESTree.JSXOpeningElement
):
  | [MessageDescriptorNodeInfo, TSESTree.ObjectExpression | undefined]
  | undefined {
  if (!node || !node.attributes) {
    return;
  }
  let values: TSESTree.ObjectExpression | undefined;
  const result: MessageDescriptorNodeInfo = {
    message: {},
    messageNode: undefined,
    descriptionNode: undefined,
  };
  for (const prop of node.attributes) {
    if (
      prop.type !== AST_NODE_TYPES.JSXAttribute ||
      prop.name.type !== AST_NODE_TYPES.JSXIdentifier
    ) {
      continue;
    }
    const key = prop.name;
    switch (key.name) {
      case 'defaultMessage':
        result.messageNode = prop.value;
        if (
          prop.value?.type === AST_NODE_TYPES.Literal &&
          typeof prop.value.value === 'string'
        ) {
          result.message.defaultMessage = prop.value.value;
        }
        break;
      case 'description':
        result.descriptionNode = prop.value;
        if (
          prop.value?.type === AST_NODE_TYPES.Literal &&
          typeof prop.value.value === 'string'
        ) {
          result.message.description = prop.value.value;
        }
        break;
      case 'id':
        if (
          prop.value?.type === AST_NODE_TYPES.Literal &&
          typeof prop.value.value === 'string'
        ) {
          result.message.id = prop.value.value;
        }
        break;
      case 'values':
        if (
          prop.value?.type === AST_NODE_TYPES.JSXExpressionContainer &&
          prop.value.expression.type === AST_NODE_TYPES.ObjectExpression
        ) {
          values = prop.value.expression;
        }
        break;
    }
  }
  if (!Object.keys(result.message).length) {
    return;
  }
  return [result, values];
}

function extractMessageDescriptors(node?: TSESTree.Expression) {
  if (
    !node ||
    node.type !== AST_NODE_TYPES.ObjectExpression ||
    !node.properties.length
  ) {
    return [];
  }
  const msgs = [];
  for (const prop of node.properties) {
    if (prop.type !== AST_NODE_TYPES.Property) {
      continue;
    }
    const msg = prop.value;
    if (msg.type !== AST_NODE_TYPES.ObjectExpression) {
      continue;
    }
    const nodeInfo = extractMessageDescriptor(msg);
    if (nodeInfo) {
      msgs.push(nodeInfo);
    }
  }
  return msgs;
}

export function extractMessages(
  node: TSESTree.Node,
  importedMacroVars: Scope.Variable[],
  excludeMessageDeclCalls = false
): Array<[MessageDescriptorNodeInfo, TSESTree.Expression | undefined]> {
  if (node.type === AST_NODE_TYPES.CallExpression) {
    const expr = node;
    const fnId = expr.callee;
    if (
      (!excludeMessageDeclCalls &&
        isSingleMessageDescriptorDeclaration(fnId, importedMacroVars)) ||
      isIntlFormatMessageCall(node)
    ) {
      const msgDescriptorNodeInfo = extractMessageDescriptor(expr.arguments[0]);
      if (msgDescriptorNodeInfo) {
        return [[msgDescriptorNodeInfo, expr.arguments[1]]];
      }
    } else if (
      !excludeMessageDeclCalls &&
      isMultipleMessageDescriptorDeclaration(fnId, importedMacroVars)
    ) {
      return extractMessageDescriptors(expr.arguments[0]).map(msg => [
        msg,
        undefined,
      ]);
    }
  } else if (
    node.type === AST_NODE_TYPES.JSXOpeningElement &&
    node.name &&
    node.name.type === AST_NODE_TYPES.JSXIdentifier &&
    node.name.name === 'FormattedMessage'
  ) {
    const msgDescriptorNodeInfo = extractMessageDescriptorFromJSXElement(node);
    if (msgDescriptorNodeInfo) {
      return [msgDescriptorNodeInfo];
    }
  }
  return [];
}
