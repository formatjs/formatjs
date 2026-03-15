import type {Plugin} from 'vite'
import {transform, type Options} from './transform.js'

export default function formatjsPlugin(options: Options = {}): Plugin {
  return {
    name: 'formatjs',
    enforce: 'pre',
    transform: {
      filter: {id: {include: /\.[jt]sx?$/, exclude: /node_modules/}},
      handler(code, id) {
        return transform(code, id, options)
      },
    },
  }
}
export type {Options} from './transform.js'
