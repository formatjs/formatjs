import * as React from 'react'

export interface PageContext {
  urlPathname: string
  routeParams: {
    path?: string
  }
}

const Context = React.createContext<PageContext | null>(null)

export function PageContextProvider({
  pathname,
  children,
}: {
  pathname: string
  children: React.ReactNode
}): React.ReactNode {
  const match = pathname.match(/^\/docs\/(.+?)\/?$/)

  return (
    <Context.Provider
      value={{
        urlPathname: pathname,
        routeParams: match ? {path: match[1]} : {},
      }}
    >
      {children}
    </Context.Provider>
  )
}

export function usePageContext(): PageContext {
  const pageContext = React.useContext(Context)

  if (!pageContext) {
    throw new Error('Page context is unavailable')
  }

  return pageContext
}
