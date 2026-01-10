#!/usr/bin/env node
import {readFileSync, writeFileSync, mkdirSync} from 'fs'
import {join, relative, dirname} from 'path'
import glob from 'fast-glob'
import matter from 'gray-matter'
import minimist from 'minimist'

const argv = minimist(process.argv.slice(2))
const outputPath = argv.out

if (!outputPath) {
  console.error('--out parameter is required')
  process.exit(1)
}

interface TypesenseDocument {
  title: string
  content: string
  url: string
  section: string
  page_title: string
  doc_type: 'guide' | 'api' | 'reference' | 'example'
  tags: string[]
  heading_level?: number
}

// Generate slug from heading text (matching rehype-slug behavior)
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

// Extract headings from MDX content
function extractHeadings(
  rawContent: string,
  strippedContent: string
): Array<{text: string; slug: string; position: number; level: number}> {
  const headings: Array<{
    text: string
    slug: string
    position: number
    level: number
  }> = []
  const lines = rawContent.split('\n')

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].trim()
      const slug = generateSlug(text)

      // Find the position of this heading text in the stripped content
      const position = strippedContent.toLowerCase().indexOf(text.toLowerCase())

      if (position !== -1) {
        headings.push({
          text,
          slug,
          position,
          level,
        })
      }
    }
  }

  return headings
}

// Strip MDX/HTML tags and get plain text
function stripMarkdown(content: string): string {
  return (
    content
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`[^`]+`/g, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, '')
      // Remove markdown links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove markdown images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      // Remove markdown headers
      .replace(/#{1,6}\s+/g, '')
      // Remove bold/italic
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
      // Remove horizontal rules
      .replace(/^[-*_]{3,}$/gm, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  )
}

// Determine document type based on path and content
function getDocType(
  path: string,
  section: string
): 'guide' | 'api' | 'reference' | 'example' {
  // API reference patterns
  if (
    path.includes('/api') ||
    section === 'tooling' ||
    path.includes('/components')
  ) {
    return 'api'
  }

  // Guide patterns
  if (
    section === 'getting-started' ||
    section === 'guides' ||
    path.includes('/guide')
  ) {
    return 'guide'
  }

  // Example patterns
  if (path.includes('/example') || path.includes('/usage')) {
    return 'example'
  }

  // Default to reference
  return 'reference'
}

// Extract tags from path and content
function extractTags(
  path: string,
  section: string,
  title: string,
  content: string
): string[] {
  const tags = new Set<string>()

  // Add section as a tag
  tags.add(section)

  // Extract common keywords from path
  const pathParts = path.split('/')
  pathParts.forEach(part => {
    // Clean up the part
    const cleaned = part.replace(/-/g, ' ').toLowerCase().trim()
    if (cleaned && cleaned.length > 2) {
      tags.add(cleaned)
    }
  })

  // Common i18n/formatjs terms
  const keywords = [
    'react',
    'intl',
    'i18n',
    'l10n',
    'format',
    'locale',
    'translation',
    'message',
    'date',
    'time',
    'number',
    'plural',
    'polyfill',
    'cli',
    'babel',
    'typescript',
    'webpack',
    'vite',
    'rollup',
  ]

  // Check title and content for keywords
  const searchText = `${title} ${content}`.toLowerCase()
  keywords.forEach(keyword => {
    if (searchText.includes(keyword)) {
      tags.add(keyword)
    }
  })

  // Limit to top 10 most relevant tags
  return Array.from(tags).slice(0, 10)
}

async function buildTypesenseIndex() {
  const docsDir = join(process.cwd(), 'docs', 'src', 'docs')
  const baseUrl = 'https://formatjs.io/docs'

  // Find all MDX files
  const mdxFiles = await glob('**/*.mdx', {
    cwd: docsDir,
    absolute: true,
  })

  console.log(`Found ${mdxFiles.length} MDX files`)

  const documents: TypesenseDocument[] = []

  // Process each MDX file
  for (const filePath of mdxFiles) {
    const content = readFileSync(filePath, 'utf-8')
    const {data: frontmatter, content: mdxContent} = matter(content)

    // Get relative path from docs/ directory
    const relativePath = relative(docsDir, filePath)
      .replace(/\.mdx$/, '')
      .replace(/\\/g, '/')

    // Extract metadata
    const pathParts = relativePath.split('/')
    const section = pathParts.length > 1 ? pathParts[0] : 'general'
    const pageTitle =
      frontmatter.title || pathParts[pathParts.length - 1].replace(/-/g, ' ')
    const plainContent = stripMarkdown(mdxContent)
    const headings = extractHeadings(mdxContent, plainContent)

    // Base URL for this document
    const docUrl = `${baseUrl}/${relativePath}`

    // Determine document type and extract tags
    const docType = getDocType(relativePath, section)
    const tags = extractTags(relativePath, section, pageTitle, plainContent)

    if (headings && headings.length > 0) {
      // Create entry for each heading section
      for (let i = 0; i < headings.length; i++) {
        const heading = headings[i]
        const nextHeading = headings[i + 1]

        const sectionStart = heading.position
        const sectionEnd = nextHeading
          ? nextHeading.position
          : plainContent.length
        const sectionContent = plainContent
          .substring(sectionStart, sectionEnd)
          .trim()

        // Build descriptive title: "Document Title > Heading"
        const docTitle = `${pageTitle} > ${heading.text}`

        documents.push({
          title: docTitle,
          content: sectionContent,
          url: `${docUrl}#${heading.slug}`,
          section,
          page_title: pageTitle,
          doc_type: docType,
          tags,
          heading_level: heading.level,
        })
      }
    } else {
      // No headings, index the whole document
      documents.push({
        title: pageTitle,
        content: plainContent,
        url: docUrl,
        section,
        page_title: pageTitle,
        doc_type: docType,
        tags,
      })
    }
  }

  console.log(
    `Created ${documents.length} Typesense documents from ${mdxFiles.length} MDX files`
  )

  // Ensure output directory exists
  mkdirSync(dirname(outputPath), {recursive: true})

  // Write JSONL format (one document per line)
  const jsonl = documents.map(doc => JSON.stringify(doc)).join('\n')
  writeFileSync(outputPath, jsonl)

  console.log(`Typesense index written to ${outputPath}`)
  console.log(`Total documents: ${documents.length}`)
  console.log(`File size: ${(jsonl.length / 1024).toFixed(2)} KB`)
}

buildTypesenseIndex().catch(err => {
  console.error('Failed to build Typesense index:', err)
  process.exit(1)
})
