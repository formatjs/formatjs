import {
  Identifier,
  ObjectExpression,
  Literal,
  CallExpression,
  Expression,
  Property,
} from 'estree';
import {Scope} from 'eslint';
import {Node, JSXOpeningElement, JSXExpressionContainer} from 'estree-jsx';

export interface MessageDescriptor {
  id?: string;
  defaultMessage?: string;
  description?: string;
}

export interface MessageDescriptorNodeInfo {
  message: MessageDescriptor;
  messageNode?: Property['value'];
  descriptionNode?: Property['value'];
}

function findReferenceImport(id: Identifier, importedVars: Scope.Variable[]) {
  return importedVars.find(
    v => !!v.references.find(ref => ref.identifier === id)
  );
}

function isIntlFormatMessageCall(node: Node) {
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
  id: Identifier,
  importedVars: Scope.Variable[]
) {
  const importedVar = findReferenceImport(id, importedVars);
  if (!importedVar) {
    return false;
  }
  return importedVar.name === '_';
}
function isMultipleMessageDescriptorDeclaration(
  id: Identifier,
  importedVars: Scope.Variable[]
) {
  const importedVar = findReferenceImport(id, importedVars);
  if (!importedVar) {
    return false;
  }
  return importedVar.name === 'defineMessages';
}

function extractMessageDescriptor(
  node?: ObjectExpression
): MessageDescriptorNodeInfo | undefined {
  if (!node || !node.properties) {
    return;
  }
  const result: MessageDescriptorNodeInfo = {
    message: {},
    messageNode: undefined,
    descriptionNode: undefined,
  };
  result.message = node.properties.reduce((msg: MessageDescriptor, prop) => {
    if (prop.key.type !== 'Identifier') {
      return msg;
    }
    const value =
      prop.value.type === 'Literal' && typeof prop.value.value === 'string'
        ? prop.value.value
        : undefined;
    switch (prop.key.name) {
      case 'defaultMessage':
        result.messageNode = prop.value;
        msg.defaultMessage = value;
        break;
      case 'description':
        result.descriptionNode = prop.value;
        msg.description = value;
        break;
      case 'id':
        msg.id = value;
    }
    return msg;
  }, {});
  return result;
}

function extractMessageDescriptorFromJSXElement(
  node?: JSXOpeningElement
): [MessageDescriptorNodeInfo, ObjectExpression | undefined] | undefined {
  if (!node || !node.attributes) {
    return;
  }
  let values: ObjectExpression | undefined = undefined;
  let messageNode: Literal | undefined;
  let descriptionNode: Literal | undefined;
  const message = node.attributes.reduce((msg: MessageDescriptor, prop) => {
    if (prop.type !== 'JSXAttribute' || prop.name.type !== 'JSXIdentifier') {
      return msg;
    }
    const key = prop.name;
    switch (key.name) {
      case 'defaultMessage':
        messageNode = prop.value as Literal;
        msg.defaultMessage = (prop.value as Literal).value as string;
        break;
      case 'description':
        descriptionNode = prop.value as Literal;
        msg.description = (prop.value as Literal).value as string;
        break;
      case 'id':
        msg.id = (prop.value as Literal).value as string;
        break;
      case 'values':
        values = (prop.value as JSXExpressionContainer)
          .expression as ObjectExpression;
        break;
    }
    return msg;
  }, {});
  if (!Object.keys(message).length) {
    return;
  }
  return [{messageNode, descriptionNode, message}, values];
}

function extractMessageDescriptors(node?: ObjectExpression) {
  if (!node || !node.properties) {
    return [];
  }
  return node.properties.reduce((msgs: MessageDescriptorNodeInfo[], prop) => {
    const msg = prop.value as ObjectExpression;
    const nodeInfo = extractMessageDescriptor(msg);
    if (nodeInfo) {
      return [...msgs, nodeInfo];
    }
    return msgs;
  }, []);
}

export function extractMessages(
  node: Node,
  importedMacroVars: Scope.Variable[],
  excludeMessageDeclCalls = false
): Array<[MessageDescriptorNodeInfo, Expression | undefined]> {
  if (node.type === 'CallExpression') {
    const expr = node as CallExpression;
    const fnId = expr.callee as Identifier;
    if (
      (!excludeMessageDeclCalls &&
        isSingleMessageDescriptorDeclaration(fnId, importedMacroVars)) ||
      isIntlFormatMessageCall(node)
    ) {
      const msgDescriptorNodeInfo = extractMessageDescriptor(
        expr.arguments[0] as ObjectExpression
      );
      if (msgDescriptorNodeInfo) {
        return [[msgDescriptorNodeInfo, expr.arguments[1] as Expression]];
      }
    } else if (
      !excludeMessageDeclCalls &&
      isMultipleMessageDescriptorDeclaration(fnId, importedMacroVars)
    ) {
      return extractMessageDescriptors(
        expr.arguments[0] as ObjectExpression
      ).map(msg => [msg, undefined]);
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
