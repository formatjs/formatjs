import {createWebpackPlugin, type UnpluginInstance} from 'unplugin'
import {unpluginFactory} from './index.js'
import type {Options} from './transform.js'

const plugin: UnpluginInstance<Options | undefined>['webpack'] =
  createWebpackPlugin(unpluginFactory)
export default plugin
export type {Options} from './transform.js'
