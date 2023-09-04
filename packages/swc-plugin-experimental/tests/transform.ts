import * as path from 'path'
import {Options as swcOptions, transformSync} from '@swc/core'
import * as fs from 'fs'

const pluginBinary = path.resolve(__dirname, '../index.wasm')

export interface MessageDescriptor {
  id: string
  defaultMessage?: string
  description?: string
}

export interface SourceLocation {
  //TBD
}

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

export type ExtractedMessageDescriptor = MessageDescriptor &
  Partial<SourceLocation> & {file?: string}

export const transform = (
  filePath: string,
  transformOptions?: swcOptions,
  pluginOptions?: any
) => {
  const code = fs.readFileSync(filePath, 'utf-8')

  const options: swcOptions = {
    filename: filePath,
    jsc: {
      parser: {
        syntax: 'ecmascript',
        jsx: true,
      },
      target: transformOptions?.jsc?.target ?? 'es2022',
      preserveAllComments: true,
    },
    isModule: transformOptions?.isModule ?? true,
    module: {
      type: 'es6',
      strict: !!transformOptions?.isModule ?? false,
    },
  }

  const testPluginOptions = {
    ...pluginOptions,
    debugExtractedMessagesComment: true,
  }

  // TODO: make this work
  // if (process.env.SWC_TRANSFORM_CUSTOM === '1') {
  //   const {transformSync} = require('../index')
  //   return transformSync(
  //     code,
  //     true,
  //     Buffer.from(JSON.stringify(options)),
  //     Buffer.from(JSON.stringify(testPluginOptions))
  //   )
  // }

  options.jsc!.experimental = {
    plugins: [[pluginBinary, testPluginOptions]],
  }

  return transformSync(code, options)
}
