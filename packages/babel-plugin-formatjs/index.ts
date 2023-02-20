import {declare} from '@babel/helper-plugin-utils'
import {PluginObj, PluginPass} from '@babel/core'
import babelPluginSyntaxJsx from '@babel/plugin-syntax-jsx'
import {ExtractedMessageDescriptor, Options, State} from './types'
import {visitor as JSXOpeningElement} from './visitors/jsx-opening-element'
import {visitor as CallExpression} from './visitors/call-expression'

export type ExtractionResult<M = Record<string, string>> = {
  messages: ExtractedMessageDescriptor[]
  meta: M
}

export const DEFAULT_ID_INTERPOLATION_PATTERN = '[sha512:contenthash:base64:6]'

// @ts-expect-error PluginPass doesn't allow custom state but it actually does
export default declare<Options, PluginObj>((api, options) => {
  api.assertVersion(7)
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
    },
  }
})
