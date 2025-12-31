import * as React from 'react'
import {usePageContext} from 'vike-react/usePageContext'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb'

// Convert kebab-case to Title Case
function toTitleCase(str: string): string {
  return str
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export default function Breadcrumbs(): React.ReactNode {
  const pageContext = usePageContext()
  const location = pageContext.urlPathname
  const pathParts = location.split('/').filter(Boolean)

  return (
    <Breadcrumb className="mb-6 pb-4 border-b border-purple-500/10">
      <BreadcrumbList className="text-sm">
        <BreadcrumbItem>
          <BreadcrumbLink
            href="/"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathParts.map((part, index) => {
          const path = `/${pathParts.slice(0, index + 1).join('/')}`
          const label = toTitleCase(part)
          const isLast = index === pathParts.length - 1

          return (
            <React.Fragment key={path}>
              <BreadcrumbSeparator className="text-purple-500/50" />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="text-white font-medium">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href={path}
                    className="text-gray-400 hover:text-purple-300 transition-colors"
                  >
                    {label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
