import {defineConfig} from 'vitest/config'

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxDev: true,
  },
})
