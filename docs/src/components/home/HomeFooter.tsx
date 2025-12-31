import * as React from 'react'
import {ExternalLink} from 'lucide-react'

export default function HomeFooter(): React.ReactNode {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Docs</h3>
            <div className="flex flex-col gap-2">
              <a
                href="/docs/getting-started/installation"
                className="text-gray-400 no-underline cursor-pointer hover:text-white hover:underline"
              >
                Getting Started
              </a>
              <a
                href="/docs/polyfills"
                className="text-gray-400 no-underline cursor-pointer hover:text-white hover:underline"
              >
                Polyfills
              </a>
              <a
                href="/docs/react-intl"
                className="text-gray-400 no-underline cursor-pointer hover:text-white hover:underline"
              >
                Libraries
              </a>
              <a
                href="/docs/tooling/cli"
                className="text-gray-400 no-underline cursor-pointer hover:text-white hover:underline"
              >
                Tooling
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Community</h3>
            <div className="flex flex-col gap-2">
              <a
                href="https://stackoverflow.com/questions/tagged/formatjs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 no-underline flex items-center gap-2 hover:text-white hover:underline"
              >
                Stack Overflow
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="text-gray-400 no-underline flex items-center gap-2 hover:text-white hover:underline"
              >
                Slack
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Social</h3>
            <div className="flex flex-col gap-2">
              <a
                href="https://github.com/formatjs/formatjs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 no-underline flex items-center gap-2 hover:text-white hover:underline"
              >
                GitHub
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 text-center mt-12">
          Copyright © {new Date().getFullYear()} FormatJS.
        </p>
      </div>
    </footer>
  )
}
