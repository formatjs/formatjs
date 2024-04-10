/// <reference types="vitest" />
import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    // for migrating from Jest
    globals: true,
  },
})
