import type {PageContext} from 'vike/types'
import * as docsMetadata from '../../../docs-metadata.generated.json'

type Metadata = {
  title: string
  description: string
}

const metadata = (docsMetadata as any).default as Record<string, Metadata>

export function title(pageContext: PageContext): string {
  const path = (pageContext.routeParams as {path?: string})?.path || ''
  const docMeta = metadata[path] || {
    title: 'Documentation',
    description:
      'FormatJS documentation. Industry-standard internationalization libraries for JavaScript.',
  }
  return `${docMeta.title} | FormatJS`
}
