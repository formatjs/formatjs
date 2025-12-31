import * as React from 'react'
import {Menu as MenuIcon, ExternalLink} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {Button} from '../ui/button'
import {SearchBar} from '../SearchBar'

const navLinks = [
  {label: 'Docs', href: '/docs/getting-started/installation'},
  {label: 'API References', href: '/docs/react-intl'},
  {label: 'Polyfills', href: '/docs/polyfills'},
  {label: 'Tooling', href: '/docs/tooling/cli'},
]

export default function HomeHeader(): React.ReactNode {
  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-purple-600/90 via-purple-700/90 to-indigo-700/90 backdrop-blur-lg border-b border-white/10 shadow-xl">
      <div className="max-w-7xl mx-auto flex items-center h-16 px-4 lg:px-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 mr-8 group">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-lg blur-md group-hover:bg-white/30 transition-all" />
            <img
              src="/img/logo-icon.svg"
              alt="FormatJS"
              className="relative h-8 w-8 transition-transform group-hover:scale-110"
            />
          </div>
          <span className="hidden sm:block text-xl font-bold text-white tracking-tight">
            FormatJS
          </span>
        </a>

        {/* Mobile Menu */}
        <div className="flex flex-1 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="navigation menu"
                className="text-white hover:bg-white/10"
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-56 bg-gray-900 border-gray-800"
            >
              {navLinks.map(link => (
                <DropdownMenuItem key={link.label} asChild>
                  <a
                    href={link.href}
                    className="cursor-pointer text-gray-100 hover:text-white"
                  >
                    {link.label}
                  </a>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem asChild>
                <a
                  href="https://github.com/formatjs/formatjs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 cursor-pointer text-gray-100 hover:text-white"
                >
                  GitHub
                  <ExternalLink className="h-4 w-4" />
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 gap-1 items-center">
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-white/90 no-underline rounded-lg transition-all hover:bg-white/10 hover:text-white cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Search */}
        <div className="mr-3 flex-1 sm:flex-initial">
          <SearchBar />
        </div>

        {/* GitHub Link */}
        <a
          href="https://github.com/formatjs/formatjs"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/90 no-underline rounded-lg transition-all hover:bg-white/10 hover:text-white group"
        >
          <span>GitHub</span>
          <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </nav>
  )
}
