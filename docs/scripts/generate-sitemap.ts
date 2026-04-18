#!/usr/bin/env node
import {writeFileSync, mkdirSync} from 'fs'
import {join, dirname} from 'path'
import glob from 'fast-glob'
import minimist from 'minimist'

const argv = minimist(process.argv.slice(2))
const outputPath = argv.out

if (!outputPath) {
  console.error('--out parameter is required')
  process.exit(1)
}

const BASE_URL = 'https://formatjs.io'

// Get docs directory relative to current working directory
// When run from Bazel, cwd is the workspace root
const docsDir = join(process.cwd(), 'docs', 'src', 'docs')

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function main(): Promise<void> {
  // Find all MDX files
  const mdxFiles = await glob('**/*.mdx', {
    cwd: docsDir,
    absolute: false,
  })

  mdxFiles.sort()

  const urls: string[] = []

  // Homepage
  urls.push(`  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`)

  // Doc pages
  for (const file of mdxFiles) {
    const path = file.replace(/\.mdx$/, '')
    const loc = escapeXml(`${BASE_URL}/docs/${path}`)
    urls.push(`  <url>
    <loc>${loc}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`)
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`

  // Ensure output directory exists
  const outputDir = dirname(outputPath)
  mkdirSync(outputDir, {recursive: true})

  writeFileSync(outputPath, sitemap)

  console.log(`\n✓ Generated sitemap with ${urls.length} URLs`)
  console.log(`  Output: ${outputPath}`)
}

main().catch(console.error)
