#!/usr/bin/env node
import {readFileSync, writeFileSync, mkdirSync} from 'fs'
import {join, relative, dirname} from 'path'
import glob from 'fast-glob'
import matter from 'gray-matter'
import minimist from 'minimist'
import lunr from 'lunr'

const argv = minimist(process.argv.slice(2))
const outputPath = argv.out

if (!outputPath) {
  console.error('--out parameter is required')
  process.exit(1)
}

interface DocEntry {
  id: string
  title: string
  path: string
  content: string
  section?: string
  headings?: Array<{text: string; slug: string; position: number}>
}

interface IndexEntry {
  id: string
  title: string
  heading?: string
  headingSlug?: string
  path: string
  section?: string
  content: string
}

// Generate slug from heading text (matching rehype-slug behavior)
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

// Extract headings from MDX content and calculate their positions in the stripped content
function extractHeadings(
  rawContent: string,
  strippedContent: string
): Array<{text: string; slug: string; position: number}> {
  const headings: Array<{text: string; slug: string; position: number}> = []
  const lines = rawContent.split('\n')

  for (const line of lines) {
    const match = line.match(/^#{1,6}\s+(.+)$/)
    if (match) {
      const text = match[1].trim()
      const slug = generateSlug(text)

      // Find the position of this heading text in the stripped content
      // Use the heading text itself to locate it
      const position = strippedContent.toLowerCase().indexOf(text.toLowerCase())

      if (position !== -1) {
        headings.push({
          text,
          slug,
          position,
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
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // Remove markdown images
      .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '')
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

async function buildSearchIndex() {
  const docsDir = join(process.cwd(), 'docs', 'src', 'docs')

  // Find all MDX files
  const mdxFiles = await glob('**/*.mdx', {
    cwd: docsDir,
    absolute: true,
  })

  console.log(`Found ${mdxFiles.length} MDX files`)

  const documents: DocEntry[] = []

  // Process each MDX file
  for (const filePath of mdxFiles) {
    const content = readFileSync(filePath, 'utf-8')
    const {data: frontmatter, content: mdxContent} = matter(content)

    // Get relative path from docs/ directory
    const relativePath = relative(docsDir, filePath)
      .replace(/\.mdx$/, '')
      .replace(/\\/g, '/')

    // Extract section from path
    const pathParts = relativePath.split('/')
    const section = pathParts.length > 1 ? pathParts[0] : undefined

    const title =
      frontmatter.title || pathParts[pathParts.length - 1].replace(/-/g, ' ')
    const plainContent = stripMarkdown(mdxContent)
    const headings = extractHeadings(mdxContent, plainContent)

    const doc: DocEntry = {
      id: relativePath,
      title,
      path: relativePath,
      content: plainContent,
      section,
      headings,
    }

    documents.push(doc)
  }

  console.log(`Indexed ${documents.length} documents`)

  // Create separate index entries for each heading section
  const indexEntries: IndexEntry[] = []

  for (const doc of documents) {
    if (doc.headings && doc.headings.length > 0) {
      // Create entry for each heading section
      for (let i = 0; i < doc.headings.length; i++) {
        const heading = doc.headings[i]
        const nextHeading = doc.headings[i + 1]

        const sectionStart = heading.position
        const sectionEnd = nextHeading
          ? nextHeading.position
          : doc.content.length
        const sectionContent = doc.content
          .substring(sectionStart, sectionEnd)
          .trim()

        indexEntries.push({
          id: `${doc.id}#${heading.slug}`,
          title: doc.title,
          heading: heading.text,
          headingSlug: heading.slug,
          path: doc.path,
          section: doc.section,
          content: sectionContent,
        })
      }
    } else {
      // No headings, index the whole document
      indexEntries.push({
        id: doc.id,
        title: doc.title,
        path: doc.path,
        section: doc.section,
        content: doc.content,
      })
    }
  }

  console.log(
    `Created ${indexEntries.length} index entries from ${documents.length} documents`
  )

  // Build Lunr index
  const idx = lunr(function () {
    this.ref('id')
    this.field('title', {boost: 10})
    this.field('heading', {boost: 5})
    this.field('content')

    indexEntries.forEach(entry => {
      this.add(entry)
    })
  })

  // Ensure output directory exists
  mkdirSync(dirname(outputPath), {recursive: true})

  // Serialize index and documents
  const searchData = {
    index: idx.toJSON(),
    documents: indexEntries.map(
      ({id, title, heading, headingSlug, path, section, content}) => ({
        id,
        title,
        heading,
        headingSlug,
        path,
        section,
        content,
      })
    ),
  }

  writeFileSync(outputPath, JSON.stringify(searchData))

  console.log(`Search index written to ${outputPath}`)
  console.log(
    `Index size: ${(JSON.stringify(searchData.index).length / 1024).toFixed(2)} KB`
  )
  console.log(
    `Documents size: ${(JSON.stringify(searchData.documents).length / 1024).toFixed(2)} KB`
  )
}

buildSearchIndex().catch(err => {
  console.error('Failed to build search index:', err)
  process.exit(1)
})
