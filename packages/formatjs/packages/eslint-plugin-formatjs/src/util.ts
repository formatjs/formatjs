import {Identifier, ObjectExpression, Literal, Node, ImportDeclaration, CallExpression} from 'estree'
import { Scope, Rule } from 'eslint';

export interface MessageDescriptor {
    id?: string
    defaultMessage?: string
    description?: string
}

function findReferenceImport (id: Identifier, importedVars: Scope.Variable[]) {
    return importedVars.find(v => !!v.references.find(ref => ref.identifier === id))
}
function isSingleMessageDescriptorDeclaration(id: Identifier, importedVars: Scope.Variable[]) {
    const importedVar = findReferenceImport(id, importedVars)
    if (!importedVar) {
        return false
    }
    return importedVar.name === '_' || importedVar.name === 'defineMessage'
}
function isMultipleMessageDescriptorDeclaration(id: Identifier, importedVars: Scope.Variable[]) {
    const importedVar = findReferenceImport(id, importedVars)
    if (!importedVar) {
        return false
    }
    return importedVar.name === 'defineMessages'
}

function extractMessageDescriptor(node?: ObjectExpression): MessageDescriptor {
    if (!node || !node.properties) {
        return {}
    }
    return node.properties.reduce((msg: MessageDescriptor, prop) => {
        const key = prop.key as Identifier
        const value = (prop.value as Literal).value as string
        switch(key.name) {
            case 'defaultMessage':
                msg.defaultMessage = value
                break
            case 'description':
                msg.description = value
                break
            case 'id':
                msg.id = value
            
        }
        return msg
    }, {})
}

function extractMessageDescriptors(node?: ObjectExpression) {
    if (!node || !node.properties) {
        return []
    }
    return node.properties.reduce((msgs: MessageDescriptor[], prop) => {
        const msg = prop.value as ObjectExpression
        msgs.push(extractMessageDescriptor(msg))
        return msgs
    }, [])
}

export function extractImportVars (context: Rule.RuleContext, node: Node) {
    const decl = node as ImportDeclaration 
    if (decl.source.value === '@formatjs/macro' || decl.source.value === 'react-intl') {
      return context.getDeclaredVariables(node);
    }
    return []
  }
  
  export function extractMessages (node: Node, importedMacroVars: Scope.Variable[]) {
    const expr = node as CallExpression;
    const fnId = expr.callee as Identifier;
    if (isSingleMessageDescriptorDeclaration(fnId, importedMacroVars)) {
      return [
        extractMessageDescriptor(expr.arguments[0] as ObjectExpression),
      ];
    } else if (
      isMultipleMessageDescriptorDeclaration(fnId, importedMacroVars)
    ) {
      return extractMessageDescriptors(expr
        .arguments[0] as ObjectExpression);
    }
    return []
  }