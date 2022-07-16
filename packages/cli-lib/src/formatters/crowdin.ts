import {CompileFn, FormatFn} from './default'

export type SmartlingJson = Record<
  string,
  {
    message: string
    description?: string
  }
>

export const format: FormatFn<SmartlingJson> = msgs => {
  const results: SmartlingJson = {}
  for (const [id, msg] of Object.entries(msgs)) {
    results[id] = {
      message: msg.defaultMessage!,
      description:
        typeof msg.description === 'string'
          ? msg.description
          : JSON.stringify(msg.description),
    }
  }
  return results
}

export const compile: CompileFn<SmartlingJson> = msgs => {
  const results: Record<string, string> = {}
  for (const [id, msg] of Object.entries(msgs)) {
    if (id === 'smartling') {
      continue
    }
    results[id] = msg.message
  }
  return results
}
