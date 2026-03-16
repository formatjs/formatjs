import {createRollupPlugin, type UnpluginInstance} from 'unplugin'
import {unpluginFactory} from './index.js'
import type {Options} from './transform.js'

const plugin: UnpluginInstance<Options | undefined>['rollup'] =
  createRollupPlugin(unpluginFactory)
export default plugin
export type {Options} from './transform.js'
