import {
  createUnplugin,
  type HookFilter,
  type UnpluginFactory,
  type UnpluginInstance,
} from 'unplugin'
import {transform, type Options} from '#packages/unplugin/transform.js'

export type {Options} from '#packages/unplugin/transform.js'

const DEFAULT_TRANSFORM_FILTER: HookFilter = {
  id: {
    include: /\.[jt]sx?(?:[?#].*)?$/,
    exclude: /node_modules/,
  },
}

export const unpluginFactory: UnpluginFactory<Options | undefined> = (
  options = {}
) => ({
  name: 'formatjs',
  enforce: 'pre' as const,
  transform: {
    filter: options.filter ?? DEFAULT_TRANSFORM_FILTER,
    handler(code: string, id: string) {
      return transform(code, id, options)
    },
  },
})

export const unplugin: UnpluginInstance<Options | undefined> =
  /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
