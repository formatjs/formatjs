import {
  MessageFormatElement,
  parse,
  PluralElement,
  TYPE,
} from '@formatjs/icu-messageformat-parser'
import {TSESTree} from '@typescript-eslint/typescript-estree'
import type {Rule} from 'eslint'
import {extractMessages, getSettings, patchMessage} from '../util'
import MagicString from 'magic-string'

function verifyAst(
  context: Rule.RuleContext,
  messageNode: TSESTree.Node,
  ast: MessageFormatElement[]
): void {
  type MessagePatch =
    | {type: 'remove'; start: number; end: number}
    | {type: 'prependLeft'; index: number; content: string}
    | {type: 'update'; start: number; end: number; content: string}

  const patches: MessagePatch[] = []

  _verifyAst(ast)

  if (patches.length > 0) {
    const patchedMessage = patchMessage(messageNode, ast, content => {
      return patches
        .reduce((magicString, patch) => {
          switch (patch.type) {
            case 'prependLeft':
              return magicString.prependLeft(patch.index, patch.content)
            case 'remove':
              return magicString.remove(patch.start, patch.end)
            case 'update':
              return magicString.update(patch.start, patch.end, patch.content)
          }
        }, new MagicString(content))
        .toString()
    })

    context.report({
      node: messageNode as any,
      messageId: 'preferPoundInPlurals',
      fix:
        patchedMessage !== null
          ? fixer => fixer.replaceText(messageNode as any, patchedMessage)
          : null,
    })
  }

  function _verifyAst(ast: ReadonlyArray<MessageFormatElement>) {
    for (let i = 0; i < ast.length; i++) {
      const current = ast[i]
      switch (current.type) {
        case TYPE.argument:
        case TYPE.number: {
          // Applicable to only plain argument or number argument without any style
          if (current.type === TYPE.number && current.style) {
            break
          }

          const next = ast[i + 1] as MessageFormatElement | undefined
          const nextNext = ast[i + 2] as MessageFormatElement | undefined

          if (
            next &&
            nextNext &&
            next.type === TYPE.literal &&
            next.value === ' ' &&
            nextNext.type === TYPE.plural &&
            nextNext.value === current.value
          ) {
            // `{A} {A, plural, one {B} other {Bs}}` => `{A, plural, one {# B} other {# Bs}}`
            _removeRangeAndPrependPluralClauses(
              current.location!.start.offset,
              next.location!.end.offset,
              nextNext,
              '# '
            )
          } else if (
            next &&
            next.type === TYPE.plural &&
            next.value === current.value
          ) {
            // `{A}{A, plural, one {B} other {Bs}}` => `{A, plural, one {#B} other {#Bs}}`
            _removeRangeAndPrependPluralClauses(
              current.location!.start.offset,
              current.location!.end.offset,
              next,
              '#'
            )
          }
          break
        }
        case TYPE.plural: {
          // `{A, plural, one {{A} B} other {{A} Bs}}` => `{A, plural, one {# B} other {# Bs}}`
          const name = current.value
          for (const {value} of Object.values(current.options)) {
            _replacementArgumentWithPound(name, value)
          }
          break
        }
        case TYPE.select: {
          for (const {value} of Object.values(current.options)) {
            _verifyAst(value)
          }
          break
        }
        case TYPE.tag:
          _verifyAst(current.children)
          break
        default:
          break
      }
    }
  }

  // Replace plain argument of number argument w/o style option that matches
  // the name with a pound sign.
  function _replacementArgumentWithPound(
    name: string,
    ast: MessageFormatElement[]
  ) {
    for (const element of ast) {
      switch (element.type) {
        case TYPE.argument:
        case TYPE.number: {
          if (
            element.value === name &&
            // Either plain argument or number argument without any style
            (element.type !== TYPE.number || !element.style)
          ) {
            patches.push({
              type: 'update',
              start: element.location!.start.offset,
              end: element.location!.end.offset,
              content: '#',
            })
          }
          break
        }
        case TYPE.tag: {
          _replacementArgumentWithPound(name, element.children)
          break
        }
        case TYPE.select: {
          for (const {value} of Object.values(element.options)) {
            _replacementArgumentWithPound(name, value)
          }
          break
        }
        default:
          break
      }
    }
  }

  // Helper to remove a certain text range and then prepend the specified text to
  // each plural clause.
  function _removeRangeAndPrependPluralClauses(
    rangeToRemoveStart: number,
    rangeToRemoveEnd: number,
    pluralElement: PluralElement,
    prependText: string
  ) {
    // Delete both the `{A}` and ` `
    patches.push({
      type: 'remove',
      start: rangeToRemoveStart,
      end: rangeToRemoveEnd,
    })
    // Insert `# ` to the beginning of every option clause
    for (const {location} of Object.values(pluralElement.options)) {
      // location marks the entire clause with the surrounding braces
      patches.push({
        type: 'prependLeft',
        index: location!.start.offset + 1,
        content: prependText,
      })
    }
  }
}

function checkNode(context: Rule.RuleContext, node: TSESTree.Node) {
  const msgs = extractMessages(node, getSettings(context))

  for (const [
    {
      message: {defaultMessage},
      messageNode,
    },
  ] of msgs) {
    if (!defaultMessage || !messageNode) {
      continue
    }

    let ast: MessageFormatElement[]
    try {
      ast = parse(defaultMessage, {captureLocation: true})
    } catch (e) {
      context.report({
        node: messageNode as any,
        message: e instanceof Error ? e.message : String(e),
      })
      return
    }

    verifyAst(context, messageNode, ast)
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer using # to reference the count in the plural argument.',
      recommended: false,
      url: 'https://formatjs.io/docs/tooling/linter#prefer-pound-in-plurals',
    },
    messages: {
      preferPoundInPlurals:
        'Prefer using # to reference the count in the plural argument instead of repeating the argument.',
    },
    fixable: 'code',
  },
  // TODO: Vue support
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
