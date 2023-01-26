import {
  MessageFormatElement,
  parse,
  TYPE,
} from '@formatjs/icu-messageformat-parser'
import {TSESTree} from '@typescript-eslint/typescript-estree'
import {Rule} from 'eslint'
import {extractMessages, getSettings} from '../util'

class JustArgument extends Error {
  public message = 'Unnecessary formatted message.'
}

class JustNumber extends Error {
  public message =
    'Unnecessary formatted message: just use FormattedNumber or intl.formatNumber.'
}

class JustDate extends Error {
  public message =
    'Unnecessary formatted message: just use FormattedDate or intl.formatDate.'
}

class JustTime extends Error {
  public message =
    'Unnecessary formatted message: just use FormattedTime or intl.formatTime.'
}

function verifyAst(ast: MessageFormatElement[]) {
  if (ast.length !== 1) {
    return
  }

  switch (ast[0]!.type) {
    case TYPE.argument:
      throw new JustArgument()
    case TYPE.number:
      throw new JustNumber()
    case TYPE.date:
      throw new JustDate()
    case TYPE.time:
      throw new JustTime()
  }
}

function checkNode(context: Rule.RuleContext, node: TSESTree.Node) {
  const settings = getSettings(context)
  const msgs = extractMessages(node, settings)

  for (const [
    {
      message: {defaultMessage},
      messageNode,
    },
  ] of msgs) {
    if (!defaultMessage || !messageNode) {
      continue
    }
    try {
      verifyAst(
        parse(defaultMessage, {
          ignoreTag: settings.ignoreTag,
        })
      )
    } catch (e) {
      context.report({
        node: messageNode as any,
        message: e instanceof Error ? e.message : String(e),
      })
    }
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unnecessary formatted message',
      recommended: true,
      url: 'https://formatjs.io/docs/tooling/linter#no-useless-message',
    },
    fixable: 'code',
  },
  create(context) {
    const callExpressionVisitor = (node: TSESTree.Node) =>
      checkNode(context, node)

    if (context.parserServices.defineTemplateBodyVisitor) {
      return context.parserServices.defineTemplateBodyVisitor(
        {
          CallExpression: callExpressionVisitor,
        },
        {
          CallExpression: callExpressionVisitor,
        }
      )
    }
    return {
      JSXOpeningElement: (node: TSESTree.Node) => checkNode(context, node),
      CallExpression: callExpressionVisitor,
    }
  },
}

export default rule
