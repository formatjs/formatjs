import {resolveRoute} from 'vike/routing'
import type {RouteSync} from 'vike/types'

export default (pageContext => {
  // Match /docs/* with any number of segments (e.g., /docs/getting-started/installation)
  const match = pageContext.urlPathname.match(/^\/docs\/(.+)$/)
  if (!match) return false

  return {
    routeParams: {
      path: match[1], // e.g., "getting-started/installation"
    },
  }
}) satisfies RouteSync
