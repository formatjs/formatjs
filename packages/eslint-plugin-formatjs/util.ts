import {TSESTree} from '@typescript-eslint/typescript-estree';
import {Scope} from 'eslint';

export interface MessageDescriptor {
  id?: string;
  defaultMessage?: string;
  description?: string;
}

export interface MessageDescriptorNodeInfo {
  message: MessageDescriptor;
  messageNode?: TSESTree.Property['value'] | TSESTree.JSXAttribute['value'];
  messagePropNode?: TSESTree.Property | TSESTree.JSXAttribute;
  descriptionNode?: TSESTree.Property['value'] | TSESTree.JSXAttribute['value'];
  idValueNode?: TSESTree.Property['value'] | TSESTree.JSXAttribute['value'];
  idPropNode?: TSESTree.Property | TSESTree.JSXAttribute;
}

function isStringLiteral(node: TSESTree.Node): node is TSESTree.StringLiteral {
  return node.type === 'Literal' && typeof node.value === 'string';
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
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    node.callee.object.type === 'Identifier' &&
    node.callee.object.name === 'intl' &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'formatMessage' &&
    node.arguments.length >= 1 &&
    node.arguments[0].type === 'ObjectExpression'
  );
}

function isSingleMessageDescriptorDeclaration(
  id: TSESTree.LeftHandSideExpression,
  importedVars: Scope.Variable[]
) {
  if (id.type !== 'Identifier') {
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
  if (id.type !== 'Identifier') {
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
  if (!node || node.type !== 'ObjectExpression') {
    return;
  }
  const result: MessageDescriptorNodeInfo = {
    message: {},
    messageNode: undefined,
    messagePropNode: undefined,
    descriptionNode: undefined,
    idValueNode: undefined,
  };
  for (const prop of node.properties) {
    if (prop.type !== 'Property' || prop.key.type !== 'Identifier') {
      continue;
    }
    const value = isStringLiteral(prop.value) ? prop.value.value : undefined;
    switch (prop.key.name) {
      case 'defaultMessage':
        result.messagePropNode = prop;
        result.messageNode = prop.value;
        result.message.defaultMessage = value;
        break;
      case 'description':
        result.descriptionNode = prop.value;
        result.message.description = value;
        break;
      case 'id':
        result.message.id = value;
        result.idValueNode = prop.value;
        result.idPropNode = prop;
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
    messagePropNode: undefined,
    descriptionNode: undefined,
    idValueNode: undefined,
    idPropNode: undefined,
  };
  for (const prop of node.attributes) {
    if (prop.type !== 'JSXAttribute' || prop.name.type !== 'JSXIdentifier') {
      continue;
    }
    const key = prop.name;
    switch (key.name) {
      case 'defaultMessage':
        result.messagePropNode = prop;
        result.messageNode = prop.value;
        if (
          prop.value?.type === 'Literal' &&
          typeof prop.value.value === 'string'
        ) {
          result.message.defaultMessage = prop.value.value;
        }
        break;
      case 'description':
        result.descriptionNode = prop.value;
        if (
          prop.value?.type === 'Literal' &&
          typeof prop.value.value === 'string'
        ) {
          result.message.description = prop.value.value;
        }
        break;
      case 'id':
        result.idValueNode = prop.value;
        result.idPropNode = prop;
        if (
          prop.value?.type === 'Literal' &&
          typeof prop.value.value === 'string'
        ) {
          result.message.id = prop.value.value;
        }
        break;
      case 'values':
        if (
          prop.value?.type === 'JSXExpressionContainer' &&
          prop.value.expression.type === 'ObjectExpression'
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
  if (!node || node.type !== 'ObjectExpression' || !node.properties.length) {
    return [];
  }
  const msgs = [];
  for (const prop of node.properties) {
    if (prop.type !== 'Property') {
      continue;
    }
    const msg = prop.value;
    if (msg.type !== 'ObjectExpression') {
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
  if (node.type === 'CallExpression') {
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
    node.type === 'JSXOpeningElement' &&
    node.name &&
    node.name.type === 'JSXIdentifier' &&
    node.name.name === 'FormattedMessage'
  ) {
    const msgDescriptorNodeInfo = extractMessageDescriptorFromJSXElement(node);
    if (msgDescriptorNodeInfo) {
      return [msgDescriptorNodeInfo];
    }
  }
  return [];
}
