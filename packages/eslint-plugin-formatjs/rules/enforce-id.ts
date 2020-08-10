import {Rule, Scope} from 'eslint';
import {ImportDeclaration, Node} from 'estree';
import {extractMessages} from '../util';
import {TSESTree} from '@typescript-eslint/typescript-estree';
import {interpolateName} from '@formatjs/ts-transformer';

function checkNode(
  context: Rule.RuleContext,
  node: Node,
  importedMacroVars: Scope.Variable[]
) {
  const msgs = extractMessages(node as TSESTree.Node, importedMacroVars);
  const {
    options: [{idInterpolationPattern}],
  } = context;
  for (const [
    {
      message: {defaultMessage, description, id},
      idPropNode,
      descriptionNode,
      messagePropNode,
    },
  ] of msgs) {
    if (!defaultMessage) {
      context.report({
        node: node as Node,
        message: `defaultMessage must be a string literal to calculate generated IDs`,
      });
    } else if (!description && descriptionNode) {
      context.report({
        node: node as Node,
        message: `description must be a string literal to calculate generated IDs`,
      });
    } else {
      const correctId = interpolateName(
        {
          resourcePath: context.getFilename(),
        } as any,
        idInterpolationPattern,
        {
          content: description
            ? `${defaultMessage}#${description}`
            : defaultMessage,
        }
      );
      if (id !== correctId) {
        context.report({
          node: node as Node,
          message: `"id" does not match with hash pattern ${idInterpolationPattern}.
Expected: ${correctId}
Actual: ${id}`,
          fix(fixer) {
            if (idPropNode) {
              if (idPropNode.type === 'JSXAttribute') {
                return fixer.replaceText(
                  idPropNode as any,
                  `id="${correctId}"`
                );
              }
              return fixer.replaceText(idPropNode as any, `id: '${correctId}'`);
            }
            // Insert after default message node
            if (messagePropNode!.type === 'JSXAttribute') {
              return fixer.insertTextAfter(
                messagePropNode as any,
                ` id="${correctId}"`
              );
            }
            return fixer.insertTextAfter(
              messagePropNode as any,
              `id: '${correctId}',`
            );
          },
        });
      }
    }
  }
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce (generated) ID in message descriptor',
      category: 'Errors',
      recommended: false,
      url: 'https://formatjs.io/docs/tooling/linter#enforce-id',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          idInterpolationPattern: {
            type: 'string',
          },
        },
        required: ['idInterpolationPattern'],
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    let importedMacroVars: Scope.Variable[] = [];
    return {
      ImportDeclaration: node => {
        const moduleName = (node as ImportDeclaration).source.value;
        if (moduleName === 'react-intl') {
          importedMacroVars = context.getDeclaredVariables(node);
        }
      },
      JSXOpeningElement: (node: Node) =>
        checkNode(context, node, importedMacroVars),
      CallExpression: node => checkNode(context, node, importedMacroVars),
    };
  },
} as Rule.RuleModule;
