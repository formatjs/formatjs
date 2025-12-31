import {usePageContext} from 'vike-react/usePageContext'
import * as React from 'react'
import * as docsMetadata from '../../../docs-metadata.generated.json'

type Metadata = {
  title: string
  description: string
}

const metadata = (docsMetadata as any).default as Record<string, Metadata>

export function Head(): React.ReactNode {
  const pageContext = usePageContext()
  const path = (pageContext.routeParams as {path?: string})?.path || ''

  // Use pre-extracted metadata from build-time processing
  const docMeta = metadata[path] || {
    title: 'Documentation',
    description:
      'FormatJS documentation. Industry-standard internationalization libraries for JavaScript.',
  }

  const fullTitle = `${docMeta.title} | FormatJS`
  const description = docMeta.description
  const url = `https://formatjs.io/docs/${path}`

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <link rel="canonical" href={url} />
    </>
  )
}
