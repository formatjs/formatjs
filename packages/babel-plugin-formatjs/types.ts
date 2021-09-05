import {NodePath} from '@babel/core'
import {
  JSXExpressionContainer,
  SourceLocation,
  StringLiteral,
} from '@babel/types'

export interface MessageDescriptor {
  id: string
  defaultMessage?: string
  description?: string
}

export interface State {
  messages: ExtractedMessageDescriptor[]
  meta: Record<string, string>
  componentNames: string[]
  functionNames: string[]
}

export type ExtractedMessageDescriptor = MessageDescriptor &
  Partial<SourceLocation> & {file?: string}

export type MessageDescriptorPath = Record<
  keyof MessageDescriptor,
  NodePath<StringLiteral> | NodePath<JSXExpressionContainer> | undefined
>

export interface Options {
  overrideIdFn?: (
    id?: string,
    defaultMessage?: string,
    description?: string,
    filePath?: string
  ) => string
  onMsgExtracted?: (filePath: string, msgs: MessageDescriptor[]) => void
  onMetaExtracted?: (filePath: string, meta: Record<string, string>) => void
  idInterpolationPattern?: string
  removeDefaultMessage?: boolean
  additionalComponentNames?: string[]
  additionalFunctionNames?: string[]
  pragma?: string
  extractSourceLocation?: boolean
  ast?: boolean
  preserveWhitespace?: boolean
}
