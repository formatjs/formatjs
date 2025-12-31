import * as React from 'react'
import {usePageContext} from 'vike-react/usePageContext'
import {Separator} from './ui/separator'
import {getNavigationTree} from '../utils/navigation'

export default function Sidebar(): React.ReactNode {
  const pageContext = usePageContext()
  const location = pageContext.urlPathname
  const navTree = getNavigationTree()

  return (
    <div className="overflow-auto h-full bg-gradient-to-b from-background to-gray-950/50 backdrop-blur-sm">
      {navTree.map((section, index) => (
        <React.Fragment key={section.title}>
          <nav className="py-3">
            <h3 className="px-4 py-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
              {section.title}
            </h3>
            <ul className="space-y-0.5 px-2">
              {section.items.map(item => {
                const isActive = location === `/docs/${item.path}`
                return (
                  <li key={item.path}>
                    <a
                      href={`/docs/${item.path}`}
                      className={`block px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium shadow-lg shadow-purple-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-0.5'
                      }`}
                    >
                      {item.title}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
          {index < navTree.length - 1 && (
            <Separator className="my-3 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
