import {
  createUnplugin,
  type UnpluginFactory,
  type UnpluginInstance,
} from 'unplugin'
import {transform, type Options} from './transform.js'

export type {Options} from './transform.js'

export const unpluginFactory: UnpluginFactory<Options | undefined> = (
  options = {}
) => ({
  name: 'formatjs',
  enforce: 'pre' as const,
  transformInclude(id: string): boolean {
    return /\.[jt]sx?$/.test(id) && !id.includes('node_modules')
  },
  transform(code: string, id: string) {
    return transform(code, id, options)
  },
})

export const unplugin: UnpluginInstance<Options | undefined> =
  /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
