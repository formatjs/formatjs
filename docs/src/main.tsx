import {createRoot, hydrateRoot} from 'react-dom/client'
import {App} from './App'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root element is missing')
}

const app = <App pathname={window.location.pathname} />

if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
