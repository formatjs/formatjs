// Default vitest configuration for Bazel sandbox compatibility.
// Preserves symlinks so Vite doesn't resolve Bazel runfile symlinks
// to paths outside the sandbox (which breaks --dom/happy-dom tests).
import {defineConfig} from 'vitest/config'

export default defineConfig({
  resolve: {
    preserveSymlinks: true,
  },
})
