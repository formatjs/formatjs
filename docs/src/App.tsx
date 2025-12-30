import * as React from 'react'
import {Route, Switch} from 'wouter'
import Layout from './components/Layout'
import DocPage from './pages/DocPage'
import Home from './pages/Home'

function App(): React.ReactNode {
  return (
    <Switch>
      <Route path="/">
        <Home />
      </Route>
      <Route path="/docs/:section/:page">
        <Layout>
          <DocPage />
        </Layout>
      </Route>
      <Route path="/docs/:page">
        <Layout>
          <DocPage />
        </Layout>
      </Route>
    </Switch>
  )
}

export default App
