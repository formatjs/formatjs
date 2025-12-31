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
    <nav className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
      <div className="flex items-center h-16 px-4">
        <a href="/" className="flex h-10 mr-4">
          <img
            src="/img/logo-icon.svg"
            alt="FormatJS"
            className="h-10 cursor-pointer"
          />
        </a>

        {/* Mobile Menu */}
        <div className="flex flex-1 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="navigation menu"
                className="text-primary-foreground hover:bg-primary/90"
              >
                <MenuIcon className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {navLinks.map(link => (
                <DropdownMenuItem key={link.label} asChild>
                  <a href={link.href} className="cursor-pointer">
                    {link.label}
                  </a>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem asChild>
                <a
                  href="https://github.com/formatjs/formatjs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  GitHub
                  <ExternalLink className="h-4 w-4" />
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 gap-6 items-center">
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              className="text-primary-foreground no-underline cursor-pointer hover:underline"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Search */}
        <div className="mr-4 flex-1 sm:flex-initial">
          <SearchBar />
        </div>

        {/* GitHub Link */}
        <a
          href="https://github.com/formatjs/formatjs"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-2 text-primary-foreground no-underline"
        >
          GitHub
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </nav>
  )
}
