import {Identifier, ObjectExpression, Literal, CallExpression} from 'estree';
import {Scope} from 'eslint';
import {Node, JSXOpeningElement} from 'estree-jsx';

export interface MessageDescriptor {
  id?: string;
  defaultMessage?: string;
  description?: string;
}

function findReferenceImport(id: Identifier, importedVars: Scope.Variable[]) {
  return importedVars.find(
    v => !!v.references.find(ref => ref.identifier === id)
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

function extractMessageDescriptor(node?: ObjectExpression): MessageDescriptor {
  if (!node || !node.properties) {
    return {};
  }
  return node.properties.reduce((msg: MessageDescriptor, prop) => {
    const key = prop.key as Identifier;
    const value = (prop.value as Literal).value as string;
    switch (key.name) {
      case 'defaultMessage':
        msg.defaultMessage = value;
        break;
      case 'description':
        msg.description = value;
        break;
      case 'id':
        msg.id = value;
    }
    return msg;
  }, {});
}

function extractMessageDescriptorFromJSXElement(
  node?: JSXOpeningElement
): MessageDescriptor {
  if (!node || !node.attributes) {
    return {};
  }
  return node.attributes.reduce((msg: MessageDescriptor, prop) => {
    if (prop.type !== 'JSXAttribute' || prop.name.type !== 'JSXIdentifier') {
      return msg;
    }
    const key = prop.name;
    const value = (prop.value as Literal).value as string;
    switch (key.name) {
      case 'defaultMessage':
        msg.defaultMessage = value;
        break;
      case 'description':
        msg.description = value;
        break;
      case 'id':
        msg.id = value;
    }
    return msg;
  }, {});
}

function extractMessageDescriptors(node?: ObjectExpression) {
  if (!node || !node.properties) {
    return [];
  }
  return node.properties.reduce((msgs: MessageDescriptor[], prop) => {
    const msg = prop.value as ObjectExpression;
    msgs.push(extractMessageDescriptor(msg));
    return msgs;
  }, []);
}

export function extractMessages(
  node: Node,
  importedMacroVars: Scope.Variable[]
) {
  if (node.type === 'CallExpression') {
    const expr = node as CallExpression;
    const fnId = expr.callee as Identifier;
    if (isSingleMessageDescriptorDeclaration(fnId, importedMacroVars)) {
      return [extractMessageDescriptor(expr.arguments[0] as ObjectExpression)];
    } else if (
      isMultipleMessageDescriptorDeclaration(fnId, importedMacroVars)
    ) {
      return extractMessageDescriptors(expr.arguments[0] as ObjectExpression);
    }
  } else if (
    node.type === 'JSXOpeningElement' &&
    node.name &&
    node.name.type === 'JSXIdentifier' &&
    node.name.name === 'FormattedMessage'
  ) {
    return [extractMessageDescriptorFromJSXElement(node)];
  }
  return [];
}
