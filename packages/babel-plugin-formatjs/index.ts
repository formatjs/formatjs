import {type PluginPass, type PluginTarget} from '@babel/core'
import {declare} from '@babel/helper-plugin-utils'
import babelPluginSyntaxJsxNs from '@babel/plugin-syntax-jsx'
import {
  type ExtractedMessageDescriptor,
  type Options,
  type State,
} from '#packages/babel-plugin-formatjs/types.js'
import {
  optionalVisitor as OptionalCallExpression,
  visitor as CallExpression,
} from '#packages/babel-plugin-formatjs/visitors/call-expression.js'
import {visitor as JSXOpeningElement} from '#packages/babel-plugin-formatjs/visitors/jsx-opening-element.js'

const babelPluginSyntaxJsx =
  (babelPluginSyntaxJsxNs as any).default || babelPluginSyntaxJsxNs

export type ExtractionResult<M = Record<string, string>> = {
  messages: ExtractedMessageDescriptor[]
  meta: M
}

export const DEFAULT_ID_INTERPOLATION_PATTERN = '[sha512:contenthash:base64:6]'

type FormatJSPlugin = PluginTarget & ReturnType<typeof declare<State, Options>>

const plugin: FormatJSPlugin = declare<State, Options>((api, options) => {
  api.assertVersion(8)
  if (!options.idInterpolationPattern) {
    options.idInterpolationPattern = DEFAULT_ID_INTERPOLATION_PATTERN
  }

  const {pragma} = options
  const componentNames = new Set<string>(options.additionalComponentNames)
  componentNames.add('FormattedMessage')
  const functionNames = new Set<string>(options.additionalFunctionNames)
  functionNames.add('formatMessage')
  // Short hand
  functionNames.add('$t')
  // Vue
  functionNames.add('$formatMessage')
  return {
    inherits: babelPluginSyntaxJsx,
    pre() {
      this.componentNames = Array.from(componentNames)
      this.functionNames = Array.from(functionNames)
    },

    visitor: {
      Program: {
        enter(this: PluginPass & State, path) {
          this.messages = []
          this.meta = {}
          if (!pragma) {
            return
          }
          for (const {leadingComments} of path.node.body) {
            if (!leadingComments) {
              continue
            }
            const pragmaLineNode = leadingComments.find(c =>
              c.value.includes(pragma)
            )
            if (!pragmaLineNode) {
              continue
            }

            pragmaLineNode.value
              .split(pragma)[1]
              .trim()
              .split(/\s+/g)
              .forEach(kv => {
                const [k, v] = kv.split(':')
                this.meta[k] = v
              })
          }
        },
        exit(
          this: PluginPass & State,
          _,
          {
            opts: _opts,
            file: {
              opts: {filename},
            },
          }
        ) {
          const opts = _opts as Options
          if (typeof opts?.onMetaExtracted === 'function') {
            opts.onMetaExtracted(filename || '', this.meta)
          }
          if (typeof opts?.onMsgExtracted === 'function') {
            opts.onMsgExtracted(filename || '', this.messages)
          }
        },
      },
      JSXOpeningElement,
      CallExpression,
      // GH #4471: Handle optional chaining calls (e.g., intl.formatMessage?.())
      OptionalCallExpression,
    },
  }
}) as FormatJSPlugin
export default plugin
