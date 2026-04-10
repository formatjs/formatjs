import {createRollupPlugin, type UnpluginInstance} from 'unplugin'
import {unpluginFactory} from '#packages/unplugin/index.js'
import type {Options} from '#packages/unplugin/transform.js'

const plugin: UnpluginInstance<Options | undefined>['rollup'] =
  createRollupPlugin(unpluginFactory)
export default plugin
export type {Options} from '#packages/unplugin/transform.js'
