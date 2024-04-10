import {defineConfig} from 'vite'
import {resolve, dirname, isAbsolute} from 'node:path'
import {fileURLToPath} from 'node:url'
import dts from 'vite-plugin-dts'

const isExternal = id => !id.startsWith('.') && !isAbsolute(id)

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [dts({include: ['src']})],
  build: {
    minify: false,
    emptyOutDir: true,
    lib: {
      target: 'node',
      entry: __dirname,
      fileName: (format, name) => {
        return `${name}.${format}`
      },

      formats: [
        // 'es',
        'cjs',
      ],
    },
    rollupOptions: {
      input: [resolve(__dirname, 'main.mts'), resolve(__dirname, 'index.ts')],
      external: isExternal,
    },
  },
})
