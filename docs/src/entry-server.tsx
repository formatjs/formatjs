import {renderToStaticMarkup, renderToString} from 'react-dom/server'
import {App} from './App'
import {PageContextProvider} from './utils/page-context'
import {Head as CommonHead} from './pages/+Head'
import {Head as HomeHead} from './pages/index/+Head'
import {Head as DocsHead} from './pages/docs/@path/+Head'

export function render(pathname: string): {html: string; head: string} {
  return {
    html: renderToString(<App pathname={pathname} />),
    head: renderToStaticMarkup(
      <PageContextProvider pathname={pathname}>
        <CommonHead />
        {pathname === '/' ? <HomeHead /> : <DocsHead />}
      </PageContextProvider>
    ),
  }
}
