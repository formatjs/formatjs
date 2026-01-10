# FormatJS Documentation - Typesense Search Integration

This documentation site uses [Typesense](https://typesense.org) for fast, typo-tolerant search across all documentation pages.

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

```bash
# Create .env file
cd docs
cp .env.example .env
```

Edit `docs/.env` and add your Typesense admin API key:

```env
TYPESENSE_ADMIN_API_KEY=your_admin_key_here
```

**Note:** The search-only API key (`zsQzkAsJQkHdtXxra3IzxOuhxEA4J8Qj`) is hardcoded in `SearchBar.tsx`. This is intentional and safe - it only allows searching, not modifications.

### 3. Build and Upload Index

```bash
# Build the Typesense index
bazel build //docs:typesense_index

# Upload to Typesense Cloud
bazel run //docs:upload_typesense_index_tool -- \
  --file=$(bazel info bazel-bin)/docs/typesense-index.jsonl
```

### 4. Test Locally

```bash
# Start dev server (search key already hardcoded)
bazel run //docs:serve

# Open http://localhost:5173
# Press Cmd+K (Mac) or Ctrl+K (Windows/Linux) to test search
```

### 5. Configure GitHub Actions

Add the `TYPESENSE_ADMIN_API_KEY` secret to your GitHub repository:

1. Go to **Settings → Secrets and variables → Actions**
2. Click **"New repository secret"**
3. Name: `TYPESENSE_ADMIN_API_KEY`
4. Value: Your Typesense admin API key
5. Click **"Add secret"**

The workflow will automatically update the index when docs are changed.

## Architecture

### Components

1. **Index Builder** ([scripts/build-typesense-index.ts](scripts/build-typesense-index.ts))
   - Scans all MDX documentation files in `src/docs/`
   - Extracts content, headings, and metadata
   - Generates JSONL file with structured documents
   - Each heading section becomes a separate searchable document

2. **Index Uploader** ([scripts/upload-typesense-index.ts](scripts/upload-typesense-index.ts))
   - Connects to Typesense Cloud (cluster: `6e4uts1pzdy7wm3fp`)
   - Creates/recreates the `docs` collection
   - Uploads all documents to Typesense
   - Runs automatically via GitHub Actions

3. **Search UI** ([src/components/SearchBar.tsx](src/components/SearchBar.tsx))
   - React component with command palette (Cmd+K / Ctrl+K)
   - Real-time search with 300ms debounce
   - Typo-tolerant search (1 typo per word)
   - Result highlighting with snippets

### Document Schema

Each document in Typesense has the following fields:

```typescript
{
  // Core fields
  title: string           // Document title (includes heading: "Doc Title > Heading")
  content: string         // Plain text content for this section
  url: string            // Full URL to the document/section (with anchor)

  // Metadata fields
  section: string        // Top-level section (e.g., "getting-started", "react-intl")
  page_title: string     // Document title without heading
  doc_type: string       // "guide", "api", "reference", or "example"
  tags: string[]         // Extracted keywords (e.g., ["react", "hooks", "i18n"])
  heading_level?: number // 1-6 for h1-h6 (optional, only for sections)
}
```

**Note:** Each heading section in a document becomes a separate searchable entry. The title field contains both the document title and heading (e.g., "React Intl > Installation") for better search context.

### Search Configuration

- **Query fields**: `title,tags,page_title,content`
- **Field weights**: title (10x), tags (8x), page_title (5x), content (1x)
- **Typo tolerance**: 1 typo per word
- **Results per page**: 10
- **Highlighting**: Enabled for all fields
- **Faceting**: Enabled for `section` and `doc_type` (for filtering)

### Search Features

**Enhanced Discovery:**

- **Smart tagging**: Automatically extracts relevant keywords (react, i18n, hooks, etc.)
- **Document classification**: Every doc is tagged as guide, API, reference, or example
- **Section filtering**: Filter results by documentation section
- **Weighted search**: Matches in titles and tags rank higher than body content

**Visual Indicators:**

- **Doc type badges**: Color-coded badges show document type at a glance
  - 🔵 Guide - Tutorial and how-to content
  - 🟣 API - API reference documentation
  - 🟢 Reference - Technical reference material
  - 🟠 Example - Code examples and samples
- **Section labels**: Shows which part of docs each result is from

## File Structure

```
docs/
├── scripts/
│   ├── build-typesense-index.ts     # Index generator
│   └── upload-typesense-index.ts    # Index uploader
├── src/
│   ├── components/
│   │   └── SearchBar.tsx            # Typesense search UI
│   └── docs/                        # MDX documentation files
├── .env.example                     # Environment variable template
├── .env                            # Your keys (gitignored)
├── BUILD.bazel                      # Bazel build configuration
└── README.md                        # This file

.github/
└── workflows/
    └── typesense-index.yml          # Auto-update workflow
```

## Bazel Targets

```bash
# Build the JSONL index file
bazel build //docs:typesense_index

# Upload index to Typesense Cloud
bazel run //docs:upload_typesense_index_tool

# Build tools (used internally)
bazel build //docs:build_typesense_index_tool
bazel build //docs:upload_typesense_index_tool

# Dev server
bazel run //docs:serve

# Build production site
bazel build //docs:dist
```

## Common Commands

### Force Index Update

```bash
bazel build //docs:typesense_index && \
bazel run //docs:upload_typesense_index_tool -- \
  --file=$(bazel info bazel-bin)/docs/typesense-index.jsonl
```

### Manual Upload with Node

```bash
export TYPESENSE_ADMIN_API_KEY=your_admin_key
node docs/scripts/upload-typesense-index.ts \
  --file=bazel-bin/docs/typesense-index.jsonl
```

### Check Index Contents

```bash
# View generated JSONL
cat bazel-bin/docs/typesense-index.jsonl | jq '.'

# Count documents
wc -l bazel-bin/docs/typesense-index.jsonl
```

### Check API Connection

```bash
# Test connection
curl -H "X-TYPESENSE-API-KEY: $TYPESENSE_ADMIN_API_KEY" \
  "https://6e4uts1pzdy7wm3fp.a1.typesense.net/health"

# View collection info
curl -H "X-TYPESENSE-API-KEY: $TYPESENSE_ADMIN_API_KEY" \
  "https://6e4uts1pzdy7wm3fp.a1.typesense.net/collections/docs"
```

## Environment Variables

### Frontend (Hardcoded)

All settings including the search-only API key are hardcoded in `SearchBar.tsx`:

- Host: `6e4uts1pzdy7wm3fp.a1.typesense.net`
- Port: `443`
- Protocol: `https`
- API Key: `zsQzkAsJQkHdtXxra3IzxOuhxEA4J8Qj` (search-only, safe to expose)

No environment variables needed for the frontend.

### Backend/Uploads (in `docs/.env` or CI)

```bash
TYPESENSE_ADMIN_API_KEY=xxx  # Admin key (keep secret!)
```

Optional overrides (defaults are fine):

```bash
TYPESENSE_HOST=6e4uts1pzdy7wm3fp-1.a1.typesense.net
TYPESENSE_PORT=443
TYPESENSE_PROTOCOL=https
```

## CI/CD

The index automatically updates when:

- Documentation files change (`docs/src/docs/**/*.mdx`)
- Index scripts change
- Workflow file changes
- Manually triggered (Actions → "Update Typesense Search Index" → Run workflow)

See [.github/workflows/typesense-index.yml](../.github/workflows/typesense-index.yml) for details.

## Search Features

### Query Capabilities

- **Full-text search**: Searches title, heading, and content
- **Weighted results**: Title has 10x weight, headings 5x, content 1x
- **Typo tolerance**: Automatically corrects 1 typo per word
- **Highlighting**: Matching terms are highlighted in results
- **Snippets**: Shows context around matching terms
- **Faceting**: Results can be filtered by section

### UI Features

- **Command palette**: Cmd+K / Ctrl+K to open
- **Real-time search**: Results update as you type (300ms debounce)
- **Section context**: Shows which section each result is from
- **Direct navigation**: Click to jump to exact heading
- **Loading states**: Shows spinner while searching
- **Empty states**: Clear messaging when no results

## Search Implementation

This documentation site uses **Typesense** for search - a fast, typo-tolerant, server-side search engine.

### Key Features

- **Fast**: Server-side search with sub-millisecond response times
- **Typo-tolerant**: Automatically handles typos and spelling mistakes
- **Small bundle size**: ~10KB client code (vs ~150KB for client-side alternatives)
- **Built-in highlighting**: Automatic result highlighting and snippets
- **Faceting**: Filter by section and document type
- **Near real-time**: Index updates automatically via CI/CD

## Typesense Cloud

**Cluster Configuration:**

- Cluster ID: `6e4uts1pzdy7wm3fp`
- Collection: `docs`
- Region: Auto-selected
- Protocol: HTTPS (port 443)

**Dashboard:** https://cloud.typesense.org/

## Troubleshooting

### Build Errors

```bash
# If dependencies are missing
pnpm install

# Check Bazel targets
bazel query //docs:all
```

### Upload Errors

**"TYPESENSE_ADMIN_API_KEY environment variable is required"**

- Make sure `.env` file exists with `TYPESENSE_ADMIN_API_KEY` set
- For scripts, export: `export TYPESENSE_ADMIN_API_KEY=your_key`

**"Collection not found"**

- The upload script auto-creates the collection, this is normal on first run

**"Invalid API key"**

- Check your API key in Typesense Cloud dashboard
- Make sure you're using the admin key (not search-only key)

### Search UI Issues

**No results showing**

- Check browser DevTools → Network tab for Typesense API calls
- Verify the collection has documents in Typesense dashboard
- Try uploading the index again

**Search not working at all**

- The search-only key is hardcoded, no config needed
- Check browser console for errors
- Verify network connectivity to Typesense Cloud

### GitHub Actions Issues

**Workflow fails on "Upload to Typesense" step**

- Make sure `TYPESENSE_ADMIN_API_KEY` secret is set in GitHub
- Check workflow logs for specific error message
- Verify the secret has the correct admin API key value

### Stale Results

The index is only updated when documentation changes. To force an update:

```bash
# Rebuild and upload
bazel build //docs:typesense_index && \
bazel run //docs:upload_typesense_index_tool -- \
  --file=$(bazel info bazel-bin)/docs/typesense-index.jsonl
```

Or trigger the GitHub Actions workflow manually.

## API Keys

### Getting Your Keys

1. Log in to [Typesense Cloud](https://cloud.typesense.org/)
2. Select your cluster (`6e4uts1pzdy7wm3fp`)
3. Go to "API Keys"
4. You'll see:
   - **Admin API Key**: Use for `TYPESENSE_ADMIN_API_KEY` (keep secret!)
   - **Search-only API Key**: Already hardcoded as `zsQzkAsJQkHdtXxra3IzxOuhxEA4J8Qj`

### Security Notes

- **Admin key**: Can create/delete collections and documents. Keep this secret!
- **Search-only key**: Can only perform searches. Safe to expose in frontend code.
- The search-only key is intentionally hardcoded and visible in the browser - this is the standard pattern for client-side search.

## Resources

- [Typesense Documentation](https://typesense.org/docs/)
- [Typesense Cloud](https://cloud.typesense.org/)
- [Typesense JavaScript Client](https://github.com/typesense/typesense-js)
- [FormatJS Documentation](https://formatjs.io)

## Support

For issues with:

- **This integration**: Open an issue in the [FormatJS repository](https://github.com/formatjs/formatjs/issues)
- **Typesense itself**: Check the [Typesense documentation](https://typesense.org/docs/) or [community forum](https://github.com/typesense/typesense/discussions)
