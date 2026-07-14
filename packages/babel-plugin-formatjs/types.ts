import {type NodePath, type PluginPass, type VisitorBase} from '@babel/core'
import {
  type JSXExpressionContainer,
  type SourceLocation,
  type StringLiteral,
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

export type VisitorFunction<K extends keyof VisitorBase<PluginPass & State>> =
  Extract<
    NonNullable<VisitorBase<PluginPass & State>[K]>,
    (...args: any[]) => any
  >

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
  flatten?: boolean
  throws?: boolean
  onMsgError?: (filePath: string, error: Error) => void
}
