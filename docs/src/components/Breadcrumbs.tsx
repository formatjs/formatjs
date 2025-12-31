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
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        {pathParts.map((part, index) => {
          const path = `/${pathParts.slice(0, index + 1).join('/')}`
          const label = toTitleCase(part)
          const isLast = index === pathParts.length - 1

          return (
            <React.Fragment key={path}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={path}>{label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
