import {createRspackPlugin, type UnpluginInstance} from 'unplugin'
import {unpluginFactory} from '#packages/unplugin/index.js'
import type {Options} from '#packages/unplugin/transform.js'

const plugin: UnpluginInstance<Options | undefined>['rspack'] =
  createRspackPlugin(unpluginFactory)
export default plugin
export type {Options} from '#packages/unplugin/transform.js'
