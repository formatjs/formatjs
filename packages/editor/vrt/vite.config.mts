import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

const root = path.dirname(fileURLToPath(import.meta.url))
const workspace = path.resolve(root, '../../..')
const nodeModules = path.join(workspace, 'node_modules')

export default defineConfig({
  root,
  cacheDir: process.env.VRT_CACHE,
  plugins: [react()],
  resolve: {
    alias: [
      'react',
      'react-dom',
      'react-intl',
      '@formatjs/icu-messageformat-parser',
    ].map(name => ({find: name, replacement: path.join(nodeModules, name)})),
    dedupe: ['react', 'react-dom'],
  },
  server: {fs: {allow: [workspace]}},
  optimizeDeps: {
    include: [
      'react',
      'react-dom/client',
      'react/jsx-runtime',
      'react-intl',
      '@formatjs/icu-messageformat-parser',
    ],
  },
})
