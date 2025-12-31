import type {RouteSync} from 'vike/types'

const route: RouteSync = (pageContext): ReturnType<RouteSync> => {
  // Match /docs/* with any number of segments (e.g., /docs/getting-started/installation)
  const match = pageContext.urlPathname.match(/^\/docs\/(.+)$/)
  if (!match) return false

  return {
    routeParams: {
      path: match[1], // e.g., "getting-started/installation"
    },
  }
}

export default route
