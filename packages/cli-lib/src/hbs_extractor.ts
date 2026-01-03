import {type Opts} from '@formatjs/ts-transformer'
import type {AST} from '@glimmer/syntax'
import {transform} from 'ember-template-recast'

function extractText(
  node: AST.MustacheStatement | AST.SubExpression,
  fileName: string,
  options: Opts
) {
  if (!options.onMsgExtracted) return
  if (!options.overrideIdFn) return

  if (node.path.type !== 'PathExpression') return

  if (['format-message', 'formatMessage'].includes(node.path.original)) {
    let [first, second] = node.params

    if (first.type !== 'StringLiteral') return

    let message = first?.value

    let desc: string | undefined
    if (second?.type === 'StringLiteral') {
      desc = second.value?.trim().replace(/\s+/gm, ' ')
    }

    let defaultMessage = message?.trim().replace(/\s+/gm, ' ')

    let id =
      typeof options.overrideIdFn === 'string'
        ? options.overrideIdFn
        : options.overrideIdFn(undefined, defaultMessage, desc, fileName)

    options.onMsgExtracted(fileName, [
      {
        id: id,
        defaultMessage: defaultMessage,
        description: desc,
      },
    ])
  }
}

export function parseFile(
  source: string,
  fileName: string,
  options: any
): void {
  let visitor = function () {
    return {
      MustacheStatement(node: AST.MustacheStatement) {
        extractText(node, fileName, options)
      },
      SubExpression(node: AST.SubExpression) {
        extractText(node, fileName, options)
      },
    }
  }

  // SAFETY: ember-template-recast's types are out of date,
  // but it does not affect runtime
  transform(source, visitor as any)
}
