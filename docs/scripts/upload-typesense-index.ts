#!/usr/bin/env node
import {readFileSync} from 'fs'
import Typesense from 'typesense'
import minimist from 'minimist'

const argv = minimist(process.argv.slice(2))
const indexFile = argv.file

if (!indexFile) {
  console.error('--file parameter is required')
  process.exit(1)
}

// Environment variables
const TYPESENSE_HOST =
  process.env.TYPESENSE_HOST || '6e4uts1pzdy7wm3fp-1.a1.typesense.net'
const TYPESENSE_ADMIN_API_KEY = process.env.TYPESENSE_ADMIN_API_KEY
const TYPESENSE_PROTOCOL = process.env.TYPESENSE_PROTOCOL || 'https'
const TYPESENSE_PORT = process.env.TYPESENSE_PORT || '443'

if (!TYPESENSE_ADMIN_API_KEY) {
  console.error('TYPESENSE_ADMIN_API_KEY environment variable is required')
  process.exit(1)
}

const collectionName = 'docs'

const schema = {
  name: collectionName,
  fields: [
    // Core fields
    {name: 'title', type: 'string' as const, facet: false},
    {name: 'content', type: 'string' as const, facet: false},
    {name: 'url', type: 'string' as const, facet: false},

    // Metadata fields
    {name: 'section', type: 'string' as const, facet: true},
    {name: 'page_title', type: 'string' as const, facet: false},
    {name: 'doc_type', type: 'string' as const, facet: true},
    {name: 'tags', type: 'string[]' as const, facet: true, optional: true},
    {name: 'heading_level', type: 'int32' as const, optional: true},
  ],
  enable_nested_fields: true,
  // Keep hyphens as part of tokens (don't split on hyphens)
  // This allows searching for "additional-component-names" as a single term
  token_separators: [],
}

async function uploadToTypesense() {
  console.log('Initializing Typesense client...')
  const client = new Typesense.Client({
    nodes: [
      {
        host: TYPESENSE_HOST,
        port: parseInt(TYPESENSE_PORT),
        protocol: TYPESENSE_PROTOCOL as 'http' | 'https',
      },
    ],
    apiKey: TYPESENSE_ADMIN_API_KEY!,
    connectionTimeoutSeconds: 10,
  })

  console.log(`Reading index file: ${indexFile}`)
  const jsonlContent = readFileSync(indexFile, 'utf-8')
  const documents = jsonlContent
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line))

  console.log(`Loaded ${documents.length} documents`)

  // Check if collection exists
  console.log(`Checking if collection "${collectionName}" exists...`)
  try {
    await client.collections(collectionName).retrieve()
    console.log(`Collection "${collectionName}" exists, deleting it...`)
    await client.collections(collectionName).delete()
    console.log('Collection deleted')
  } catch (error: any) {
    if (error.httpStatus === 404) {
      console.log('Collection does not exist, will create new one')
    } else {
      throw error
    }
  }

  // Create collection
  console.log('Creating collection...')
  await client.collections().create(schema)
  console.log('Collection created')

  // Import documents
  console.log('Importing documents...')
  const importResult = await client
    .collections(collectionName)
    .documents()
    .import(documents, {action: 'create'})

  // Check for errors - importResult can be a string or array
  let results: any[]
  if (typeof importResult === 'string') {
    results = importResult
      .split('\n')
      .filter((line: string) => line.trim())
      .map((line: string) => JSON.parse(line))
  } else if (Array.isArray(importResult)) {
    results = importResult
  } else {
    // Single result object
    results = [importResult]
  }

  const errors = results.filter(r => !r.success)
  if (errors.length > 0) {
    console.error(`Failed to import ${errors.length} documents:`)
    errors.slice(0, 5).forEach(err => {
      console.error(`  - ${err.error}: ${JSON.stringify(err.document)}`)
    })
    if (errors.length > 5) {
      console.error(`  ... and ${errors.length - 5} more errors`)
    }
    process.exit(1)
  }

  console.log(`Successfully imported ${results.length} documents`)
  console.log(`Collection "${collectionName}" is ready`)

  // Print some stats
  const stats = await client.collections(collectionName).retrieve()
  console.log(`\nCollection stats:`)
  console.log(`  - Name: ${stats.name}`)
  console.log(`  - Number of documents: ${stats.num_documents}`)
  console.log(
    `  - Created at: ${new Date(stats.created_at * 1000).toISOString()}`
  )
}

uploadToTypesense().catch(err => {
  console.error('Failed to upload to Typesense:', err)
  process.exit(1)
})
