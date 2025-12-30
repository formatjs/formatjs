import {useParams} from 'wouter'
import * as React from 'react'
import {Suspense, lazy} from 'react'
import {MDXProvider} from '@mdx-js/react'
import {Box, CircularProgress} from '@mui/material'
import {mdxComponents} from '../components/MDXComponents'

interface DocPageProps {
  path?: string
}

// Use import.meta.glob to load all MDX files
const allModules = import.meta.glob<{default: React.ComponentType}>(
  '../docs/**/*.mdx',
  {eager: false}
)

export default function DocPage({
  path: defaultPath,
}: DocPageProps): React.ReactNode {
  const params = useParams<{section?: string; page?: string}>()
  const docPath =
    defaultPath ||
    (params.section ? `${params.section}/${params.page}` : params.page)

  // Try to find the module in our pre-loaded map
  const modulePath = `../docs/${docPath}.mdx`
  const loader = allModules[modulePath]

  if (!loader) {
    return (
      <article className="doc-article">
        <h1>Document not found</h1>
        <p>Could not find document at path: {docPath}</p>
      </article>
    )
  }

  const DocContent = lazy(() => loader().then(mod => ({default: mod.default})))

  return (
    <MDXProvider components={mdxComponents}>
      <article className="doc-article">
        <Suspense
          fallback={
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
              }}
            >
              <CircularProgress />
            </Box>
          }
        >
          <DocContent />
        </Suspense>
      </article>
    </MDXProvider>
  )
}
