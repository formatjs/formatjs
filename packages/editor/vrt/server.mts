import path from 'node:path'
import {createServer} from 'vite'
import type {ServerAdapter} from '@rules-web-e2e/vrt/server'

const start: ServerAdapter = async ({root, inputs, cache, host}) => {
  const server = await createServer({
    configFile: path.join(root, 'vite.config.mts'),
    envDir: false,
    cacheDir: cache,
    css: {postcss: {}},
    server: {host, port: 0, open: false, fs: {strict: true, allow: [inputs]}},
  })
  try {
    await server.listen()
    return {url: server.resolvedUrls!.local[0], close: () => server.close()}
  } catch (error) {
    await server.close()
    throw error
  }
}
export default start
