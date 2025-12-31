import type {OnBeforePrerenderStartAsync} from 'vike/types'
import type * as FastGlobType from 'fast-glob'
import {join} from 'path'

// Use dynamic import to work around esModuleInterop issues
const getFastGlob = async (): Promise<typeof FastGlobType> => {
  return await import('fast-glob')
}

// Global flag to prevent duplicate execution in Bazel environments
// where this file may be loaded from multiple paths
let hasExecuted = false

export const onBeforePrerenderStart: OnBeforePrerenderStartAsync = async () => {
  // Prevent duplicate execution
  if (hasExecuted) {
    return []
  }
  hasExecuted = true

  const docsDir = join(process.cwd(), 'src', 'docs')

  // Find all MDX files
  const glob = await getFastGlob()
  const mdxFiles: string[] = await (glob as any).default('**/*.mdx', {
    cwd: docsDir,
    absolute: false,
  })

  // Convert file paths to URLs
  const urls = mdxFiles.map((file: string) => {
    const path = file.replace(/\.mdx$/, '')
    return `/docs/${path}`
  })

  return urls
}
