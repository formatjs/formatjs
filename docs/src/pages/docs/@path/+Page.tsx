export {Page}

import * as React from 'react'
import {MDXProvider} from '@mdx-js/react'
import {usePageContext} from '../../../utils/page-context'
import Layout from '../../../components/Layout'
import Admonition from '../../../components/Admonition'
import {mdxComponents} from '../../../components/MDXComponents'

// Eagerly import all MDX files for static page generation.
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
  const recommendNativeHermes =
    path === 'polyfills' ||
    path?.startsWith('polyfills/intl-') ||
    path === 'guides/react-native-hermes' ||
    path === 'guides/hermes-intl' ||
    path === 'guides/runtime-requirements' ||
    path === 'react-intl'

  return (
    <Layout>
      <MDXProvider components={mdxComponents}>
        <article className="doc-article">
          {recommendNativeHermes && (
            <Admonition type="tip" title="Using Hermes? Prefer native Intl">
              <p>
                We recommend the Rust-backed Hermes Intl SDK over TypeScript
                polyfills for Hermes apps. It installs twelve Intl APIs before
                your application JavaScript runs, with locale data compiled into
                the SDK.
              </p>
              <p>
                <a
                  href="/docs/guides/hermes-intl"
                  className="font-medium underline underline-offset-4"
                >
                  Get started with native Intl
                </a>
                . Native integration requires rebuilding your app. Use
                TypeScript polyfills when you cannot add native code.
              </p>
            </Admonition>
          )}
          <MDXContent />
        </article>
      </MDXProvider>
    </Layout>
  )
}
