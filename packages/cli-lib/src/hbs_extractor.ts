import {transform} from 'ember-template-recast'

function extractText(node: any, fileName: any, options: any) {
  if (['format-message', 'formatMessage'].includes(node.path.original)) {
    let message = node.params[0]?.original
    let desc = node.params[1]?.original?.trim().replace(/\s+/gm, ' ')
    let defaultMessage = message?.trim().replace(/\s+/gm, ' ')

    let id = options.overrideIdFn(undefined, defaultMessage, desc, fileName)
    options.onMsgExtracted(undefined, {
      id: id,
      defaultMessage: defaultMessage,
      description: desc,
    })
  }
}

export function parseFile(source: string, fileName: string, options: any) {
  let visitor = function () {
    return {
      MustacheStatement(node: any) {
        extractText(node, fileName, options)
      },
      SubExpression(node: any) {
        extractText(node, fileName, options)
      },
    }
  }

  transform(source, visitor)
}
