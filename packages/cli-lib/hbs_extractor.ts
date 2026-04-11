import {type Opts} from '@formatjs/ts-transformer'
import {preprocess, traverse, type AST, type ASTv1} from '@glimmer/syntax'

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
  const ast = preprocess(source)
  traverse(ast, {
    MustacheStatement(node: ASTv1.MustacheStatement) {
      extractText(node, fileName, options)
    },
    SubExpression(node: ASTv1.SubExpression) {
      extractText(node, fileName, options)
    },
  })
}
