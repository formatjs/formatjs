export interface MessageDescriptor {
  id: string
  description?: string | object
  defaultMessage?: string
  file?: string
  start?: number
  end?: number
}

export type MessageExtractor = (
  filePath: string,
  messages: MessageDescriptor[]
) => void

export type MetaExtractor = (
  filePath: string,
  meta: Record<string, string>
) => void

export type OverrideIdFn = (
  id?: string,
  defaultMessage?: string,
  description?: string | object,
  filePath?: string
) => string

export interface ExtractTransformOptions {
  pragma?: string
  extractSourceLocation?: boolean
  removeDefaultMessage?: boolean
  additionalComponentNames?: string[]
  additionalFunctionNames?: string[]
  onMsgExtracted?: MessageExtractor
  onMetaExtracted?: MetaExtractor
  overrideIdFn?: OverrideIdFn | string
  ast?: boolean
  preserveWhitespace?: boolean
  flatten?: boolean
  throws?: boolean
  onMsgError?: (filePath: string, error: Error) => void
}
