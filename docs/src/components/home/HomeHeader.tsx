import * as React from 'react'
import {Menu as MenuIcon} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {SearchBar} from '../SearchBar'

const navLinks = [
  {label: 'Docs', href: '/docs/getting-started/installation'},
  {label: 'Libraries', href: '#libraries'},
  {label: 'ICU syntax', href: '/docs/core-concepts/icu-syntax'},
  {label: 'GitHub', href: 'https://github.com/formatjs/formatjs'},
]

export default function HomeHeader(): React.ReactNode {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center gap-4 px-[clamp(20px,2.2vw,32px)] py-4 md:gap-8 md:py-5">
      <a
        href="/"
        aria-label="FormatJS home"
        className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight no-underline"
      >
        <img src="/img/logo-icon.svg" alt="" width={26} height={28} />
        <span>FormatJS</span>
      </a>

      <nav
        aria-label="Primary"
        className="ml-auto hidden items-center gap-7 lg:flex"
      >
        {navLinks.map(link => (
          <a
            key={link.label}
            href={link.href}
            className="font-medium no-underline hover:underline"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3 lg:ml-0">
        <SearchBar />
        <a
          href="/docs/getting-started/installation"
          className="hidden min-h-12 items-center bg-primary px-5 font-medium text-white no-underline transition-colors hover:bg-brand-hover sm:inline-flex"
        >
          Installation guide
        </a>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Navigation menu"
              className="inline-flex size-11 items-center justify-center bg-home-raised lg:hidden"
            >
              <MenuIcon className="size-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 border-home-raised bg-home-surface"
          >
            {[
              ...navLinks,
              {label: 'Installation guide', href: navLinks[0].href},
            ].map(link => (
              <DropdownMenuItem key={link.label} asChild>
                <a href={link.href} className="cursor-pointer text-home-ink">
                  {link.label}
                </a>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
