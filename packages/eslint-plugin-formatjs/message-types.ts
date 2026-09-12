import {
  TYPE,
  type MessageFormatElement,
} from '@formatjs/icu-messageformat-parser'

/** Derive one contract from the runtime parser's AST, including every branch. */
export function messageTypes(
  ast: MessageFormatElement[],
  module: string
): string {
  const argumentsByName = new Map<string, Set<string>>()
  function visit(elements: MessageFormatElement[]) {
    for (const element of elements) {
      if (element.type === TYPE.literal || element.type === TYPE.pound) continue
      const types = argumentsByName.get(element.value) ?? new Set<string>()
      argumentsByName.set(element.value, types)
      switch (element.type) {
        case TYPE.argument:
          break
        case TYPE.number:
        case TYPE.plural:
          types.add('number')
          break
        case TYPE.date:
        case TYPE.time:
          types.add('date')
          break
        case TYPE.select:
          types.add('select')
          break
        case TYPE.tag:
          types.add('tag')
          visit(element.children)
          break
      }
      if (element.type === TYPE.select || element.type === TYPE.plural) {
        for (const option of Object.values(element.options)) visit(option.value)
      }
    }
  }
  visit(ast)
  const fields = [...argumentsByName]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([name, types]) => {
      let type: string
      if (!types.size) type = `import(${JSON.stringify(module)}).MessageValue`
      else if (types.size === 2 && types.has('number') && types.has('date'))
        type = 'number'
      else if (types.size > 1)
        throw new Error(`Incompatible uses of argument ${JSON.stringify(name)}`)
      else if (types.has('number')) type = 'number | bigint'
      else if (types.has('date')) type = 'number | Date'
      else if (types.has('select')) type = 'string'
      else type = `import(${JSON.stringify(module)}).MessageTag`
      return `${JSON.stringify(name)}: ${type}`
    })
  return fields.length ? `{ ${fields.join('; ')} }` : '{}'
}
