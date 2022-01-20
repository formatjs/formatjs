import {Comparator} from 'json-stable-stringify'
import {CompileFn, FormatFn} from './default'

export interface SmartlingDirectives {
  translate_paths: [
    {
      path: string
      key: string
      instruction: string
    }
  ]
  variants_enabled: boolean
  string_format: string
  [k: string]: any
}

export type SmartlingJson = {
  smartling: SmartlingDirectives
} & Record<
  string,
  {
    message: string
    description?: string
  }
>

export const format: FormatFn<SmartlingJson> = msgs => {
  const results: SmartlingJson = {
    smartling: {
      translate_paths: [
        {
          path: '*/message',
          key: '{*}/message',
          instruction: '*/description',
        },
      ],
      variants_enabled: true,
      string_format: 'icu',
    },
  } as any
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

export const compareMessages: Comparator = (el1, el2) => {
  // `smartling` has to be the 1st key
  if (el1.key === 'smartling') {
    return -1
  }
  if (el2.key === 'smartling') {
    return 1
  }
  return el1.key < el2.key ? -1 : el1.key === el2.key ? 0 : 1
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
