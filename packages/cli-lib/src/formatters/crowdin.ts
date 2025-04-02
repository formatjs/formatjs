import {CompileFn, FormatFn} from './default.js'

export type CrowdinJson = Record<
  string,
  {
    message: string
    description?: string
  }
>

export const format: FormatFn<CrowdinJson> = msgs => {
  const results: CrowdinJson = {}
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

export const compile: CompileFn<CrowdinJson> = msgs => {
  const results: Record<string, string> = {}
  for (const [id, msg] of Object.entries(msgs)) {
    if (id === 'smartling') {
      continue
    }
    results[id] = msg.message
  }
  return results
}
