import * as React from 'react'
import * as docsMetadata from './docs-metadata.generated.json'
import {
  handleNavigationClick,
  NAVIGATION_EVENT,
} from './utils/client-navigation'
import {PageContextProvider} from './utils/page-context'
import {Page as DocsPage} from './pages/docs/@path/+Page'
import Home from './pages/Home'
import './styles/global.css'
import 'prismjs/themes/prism-tomorrow.css'

const metadata = (docsMetadata as any).default as Record<
  string,
  {title: string; description: string}
>

export function App({
  pathname: initialPathname,
}: {
  pathname: string
}): React.ReactNode {
  const [pathname, setPathname] = React.useState(initialPathname)

  React.useEffect(() => {
    const updatePathname = (): void => {
      setPathname(window.location.pathname)
    }

    document.addEventListener('click', handleNavigationClick)
    window.addEventListener('popstate', updatePathname)
    window.addEventListener(NAVIGATION_EVENT, updatePathname)

    return () => {
      document.removeEventListener('click', handleNavigationClick)
      window.removeEventListener('popstate', updatePathname)
      window.removeEventListener(NAVIGATION_EVENT, updatePathname)
    }
  }, [])

  React.useEffect(() => {
    if (pathname === '/') {
      document.title =
        'FormatJS - Internationalize your web apps on the client & server'
      return
    }

    const path = pathname.replace(/^\/docs\//, '').replace(/\/$/, '')
    const docMetadata = metadata[path]

    document.title = `${docMetadata?.title || 'Documentation'} | FormatJS`

    if (docMetadata) {
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute('content', docMetadata.description)
    }

    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute('href', `https://formatjs.io/docs/${path}`)
  }, [pathname])

  return (
    <PageContextProvider pathname={pathname}>
      {pathname === '/' ? <Home /> : <DocsPage />}
    </PageContextProvider>
  )
}
