import {
  createUnplugin,
  type UnpluginFactory,
  type UnpluginInstance,
} from 'unplugin'
import {transform, type Options} from '#packages/unplugin/transform.js'

export type {Options} from '#packages/unplugin/transform.js'

export const unpluginFactory: UnpluginFactory<Options | undefined> = (
  options = {}
) => ({
  name: 'formatjs',
  enforce: 'pre' as const,
  transformInclude(id: string): boolean {
    // Strip query/hash so virtual chunk IDs like
    // `route.tsx?route-chunk=main` (e.g. React Router's clientLoader/
    // clientAction split) still match the JS/TS extension test.
    const path = id.replace(/[?#].*$/, '')
    return /\.[jt]sx?$/.test(path) && !path.includes('node_modules')
  },
  transform(code: string, id: string) {
    return transform(code, id, options)
  },
})

export const unplugin: UnpluginInstance<Options | undefined> =
  /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
