import {
  Identifier,
  ObjectExpression,
  Literal,
  CallExpression,
  Expression,
} from 'estree';
import {Scope} from 'eslint';
import {Node, JSXOpeningElement, JSXExpressionContainer} from 'estree-jsx';

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
): [MessageDescriptor, ObjectExpression | undefined] {
  if (!node || !node.attributes) {
    return [{}, undefined];
  }
  let values: ObjectExpression | undefined = undefined;
  const descriptor = node.attributes.reduce((msg: MessageDescriptor, prop) => {
    if (prop.type !== 'JSXAttribute' || prop.name.type !== 'JSXIdentifier') {
      return msg;
    }
    const key = prop.name;
    switch (key.name) {
      case 'defaultMessage':
        msg.defaultMessage = (prop.value as Literal).value as string;
        break;
      case 'description':
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
  return [descriptor, values];
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
): Array<[MessageDescriptor, Expression | undefined]> {
  if (node.type === 'CallExpression') {
    const expr = node as CallExpression;
    const fnId = expr.callee as Identifier;
    if (
      isSingleMessageDescriptorDeclaration(fnId, importedMacroVars) ||
      isIntlFormatMessageCall(node)
    ) {
      return [
        [
          extractMessageDescriptor(expr.arguments[0] as ObjectExpression),
          expr.arguments[1] as Expression,
        ],
      ];
    } else if (
      isMultipleMessageDescriptorDeclaration(fnId, importedMacroVars)
    ) {
      return extractMessageDescriptors(expr
        .arguments[0] as ObjectExpression).map(msg => [msg, undefined]);
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
