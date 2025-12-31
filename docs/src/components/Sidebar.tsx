import * as React from 'react'
import {usePageContext} from 'vike-react/usePageContext'
import {Separator} from './ui/separator'
import {getNavigationTree} from '../utils/navigation'

export default function Sidebar(): React.ReactNode {
  const pageContext = usePageContext()
  const location = pageContext.urlPathname
  const navTree = getNavigationTree()

  return (
    <div className="overflow-auto h-full">
      {navTree.map((section, index) => (
        <React.Fragment key={section.title}>
          <nav className="py-2">
            <h3 className="px-4 py-2 text-sm font-semibold text-foreground/70 uppercase tracking-wide">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map(item => {
                const isActive = location === `/docs/${item.path}`
                return (
                  <li key={item.path}>
                    <a
                      href={`/docs/${item.path}`}
                      className={`block px-4 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                        isActive
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {item.title}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
          {index < navTree.length - 1 && <Separator />}
        </React.Fragment>
      ))}
    </div>
  )
}
