#!/usr/bin/env node
import {readFileSync, writeFileSync, mkdirSync} from 'fs'
import {join, dirname} from 'path'
import glob from 'fast-glob'
import minimist from 'minimist'

const argv = minimist(process.argv.slice(2))
const outputPath = argv.out

if (!outputPath) {
  console.error('--out parameter is required')
  process.exit(1)
}

// Get docs directory relative to current working directory
// When run from Bazel, cwd is the workspace root
const docsDir = join(process.cwd(), 'docs', 'src', 'docs')

interface DocMetadata {
  title: string
  description: string
}

type MetadataCollection = Record<string, DocMetadata>

// Extract description from MDX content
function extractDescription(content: string): string {
  const lines = content.split('\n')
  let description = ''

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip empty lines
    if (!trimmed) continue

    // Skip badges and images
    if (trimmed.startsWith('[![') || trimmed.startsWith('![')) continue

    // Skip reference links like [numberformat]: https://...
    if (/^\[.+\]:\s*https?:\/\//.test(trimmed)) continue

    // Skip headings
    if (trimmed.startsWith('#')) continue

    // Skip import statements
    if (trimmed.startsWith('import ')) continue

    // Skip JSX component tags (opening tags only)
    if (trimmed.startsWith('<') && !trimmed.startsWith('</')) continue

    // This is likely our description
    // Remove markdown formatting
    let cleaned = trimmed
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove inline markdown links [text](url)
      .replace(/\[([^\]]+)\]\[[^\]]+\]/g, '$1') // Remove reference-style links [text][ref]
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/_([^_]+)_/g, '$1') // Remove italic

    description = cleaned
    break
  }

  // Fallback if no description found
  if (!description) {
    description =
      'FormatJS documentation. Industry-standard internationalization libraries for JavaScript.'
  }

  // Limit description length to ~155 characters for SEO
  if (description.length > 155) {
    description = description.substring(0, 152) + '...'
  }

  return description
}

// Extract title from path
function extractTitle(path: string): string {
  const pathParts = path.split('/')
  const lastPart = pathParts[pathParts.length - 1] || 'docs'
  return lastPart
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

async function main(): Promise<void> {
  // Find all MDX files
  const mdxFiles = await glob('**/*.mdx', {
    cwd: docsDir,
    absolute: false,
  })

  mdxFiles.sort()

  const metadata: MetadataCollection = {}

  for (const file of mdxFiles) {
    const path = file.replace(/\.mdx$/, '')
    const fullPath = join(docsDir, file)

    try {
      const content = readFileSync(fullPath, 'utf-8')
      const description = extractDescription(content)
      const title = extractTitle(path)

      metadata[path] = {
        title,
        description,
      }

      console.log(`✓ Extracted metadata for: ${path}`)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      console.error(`✗ Error processing ${file}:`, errorMessage)
    }
  }

  // Ensure output directory exists
  const outputDir = dirname(outputPath)
  mkdirSync(outputDir, {recursive: true})

  // Write metadata to JSON file
  writeFileSync(outputPath, JSON.stringify(metadata, null, 2))

  console.log(
    `\n✓ Generated metadata for ${Object.keys(metadata).length} documents`
  )
  console.log(`  Output: ${outputPath}`)
}

main().catch(console.error)
