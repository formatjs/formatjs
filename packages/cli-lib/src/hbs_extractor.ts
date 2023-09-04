import {transform} from 'ember-template-recast'

function extractText(node: any, fileName: any, options: any) {
  if (node.path.original === 'format-message') {
    let message = node.params[0]?.original
    let desc = node.params[1]?.original?.trim().replace(/\s+/gm, ' ')
    let defaultMessage = message?.trim().replace(/\s+/gm, ' ')
    // overrideIdFn needs to receive defaultMessage/description with already trimmed whitespaces
    // so the resulting id is the same if messages have the same content but have different indentation
    // id has to be generated the same way in soxhub/ember-formatjs/replace-key-transform !!!!!!!!!!!!!!!!!!!!!!
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
