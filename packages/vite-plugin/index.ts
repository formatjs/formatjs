import type {Plugin} from 'vite'
import {transform, type Options} from './transform.js'

export default function formatjsPlugin(options: Options = {}): Plugin {
  return {
    name: 'formatjs',
    enforce: 'pre',
    transform(code, id) {
      if (/node_modules/.test(id)) return
      if (!/\.[jt]sx?$/.test(id)) return
      return transform(code, id, options)
    },
  }
}
export type {Options} from './transform.js'
