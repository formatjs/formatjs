export {Page}

import * as React from 'react'
import {MDXProvider} from '@mdx-js/react'
import {usePageContext} from 'vike-react/usePageContext'
import Layout from '../../../components/Layout'
import {mdxComponents} from '../../../components/MDXComponents'

// Eagerly import all MDX files for SSR
const modules = import.meta.glob<{default: React.ComponentType}>(
  '../../../docs/**/*.mdx',
  {eager: true}
)

function Page(): React.ReactNode {
  const pageContext = usePageContext()
  const path = (pageContext.routeParams as {path?: string})?.path

  const modulePath = `../../../docs/${path}.mdx`
  const module = modules[modulePath]

  if (!module) {
    return (
      <Layout>
        <article className="doc-article">
          <h1>Document not found</h1>
          <p>Could not find document at path: {path}</p>
        </article>
      </Layout>
    )
  }

  const MDXContent = module.default

  return (
    <Layout>
      <MDXProvider components={mdxComponents}>
        <article className="doc-article">
          <MDXContent />
        </article>
      </MDXProvider>
    </Layout>
  )
}
