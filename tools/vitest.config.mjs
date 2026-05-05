// Default vitest configuration for Bazel sandbox compatibility.
// Preserves symlinks so Vite doesn't resolve Bazel runfile symlinks
// to paths outside the sandbox (which breaks --dom/happy-dom tests).
import {defineConfig} from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^#formatjs_generated\/(.*)$/,
        replacement: path.resolve('$1'),
      },
    ],
    preserveSymlinks: true,
  },
})
