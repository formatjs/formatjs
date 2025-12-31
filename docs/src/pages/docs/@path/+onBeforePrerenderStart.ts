import type {OnBeforePrerenderStartAsync} from 'vike/types'
import glob from 'fast-glob'
import {join, relative} from 'path'

export const onBeforePrerenderStart: OnBeforePrerenderStartAsync = async () => {
  const docsDir = join(process.cwd(), 'docs', 'src', 'docs')

  // Find all MDX files
  const mdxFiles = await glob('**/*.mdx', {
    cwd: docsDir,
    absolute: false,
  })

  // Convert file paths to URLs
  const urls = mdxFiles.map(file => {
    const path = file.replace(/\.mdx$/, '')
    return `/docs/${path}`
  })

  return urls
}
