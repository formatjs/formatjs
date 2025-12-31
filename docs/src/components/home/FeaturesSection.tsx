import * as React from 'react'

export default function FeaturesSection(): React.ReactNode {
  return (
    <div className="bg-gradient-to-b from-background to-gray-950 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why FormatJS?
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Industry-standard internationalization built on web standards
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* First column - Modular Libraries */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
            <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-8 h-full transition-all duration-300 group-hover:border-purple-500">
              <div className="mb-6 space-y-2">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-3 text-center transform transition-transform group-hover:scale-105">
                  <p className="uppercase text-xs font-bold text-white tracking-wider">
                    FormatJS Integrations
                  </p>
                </div>
                <div className="bg-gradient-to-r from-purple-700 to-indigo-700 rounded-lg p-3 text-center transform transition-transform group-hover:scale-105">
                  <p className="uppercase text-xs font-bold text-white tracking-wider">
                    FormatJS Core Libs
                  </p>
                </div>
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-3 text-center transform transition-transform group-hover:scale-105">
                  <p className="uppercase text-xs font-bold text-gray-900 tracking-wider">
                    ECMA-402 + Polyfills
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">
                  Modular Libraries
                </h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                A modular collection of JavaScript libraries focused on
                formatting numbers, dates, and strings. Core libraries build on
                JavaScript Intl built-ins and industry-wide i18n standards.
              </p>
            </div>
          </div>

          {/* Middle - Framework Integrations */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
            <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-8 h-full transition-all duration-300 group-hover:border-indigo-500">
              <div className="flex gap-4 items-center justify-center mb-6 min-h-[140px]">
                <div className="transition-transform group-hover:scale-110 duration-300">
                  <img
                    src="/img/react.svg"
                    alt="React"
                    className="h-16 w-16 object-contain drop-shadow-lg"
                  />
                </div>
                <div className="transition-transform group-hover:scale-110 duration-300">
                  <img
                    src="/img/ember.svg"
                    alt="Ember"
                    className="h-16 w-16 object-contain drop-shadow-lg"
                  />
                </div>
                <div className="transition-transform group-hover:scale-110 duration-300">
                  <img
                    src="/img/vue-logo.svg"
                    alt="Vue"
                    className="h-16 w-16 object-contain drop-shadow-lg"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-indigo-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">
                  Framework Integrations
                </h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Built-in integrations with React and Vue. Internationalization
                happens in the template or view layer with easy-to-use
                components and hooks.
              </p>
            </div>
          </div>

          {/* Right - Standards Based */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
            <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-8 h-full transition-all duration-300 group-hover:border-yellow-500">
              <div className="flex items-center justify-center mb-6 min-h-[140px]">
                <div className="transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300">
                  <img
                    src="/img/js.svg"
                    alt="JavaScript"
                    className="h-20 w-20 drop-shadow-2xl"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-yellow-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">
                  Standards Based
                </h3>
              </div>
              <p className="text-gray-400 leading-relaxed mb-4">
                Aligned with{' '}
                <a
                  href="https://tc39.es/ecma402/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-400 hover:text-yellow-300 underline transition-colors"
                >
                  ECMAScript
                </a>
                ,{' '}
                <a
                  href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-400 hover:text-yellow-300 underline transition-colors"
                >
                  ECMA-402
                </a>
                ,{' '}
                <a
                  href="http://cldr.unicode.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-400 hover:text-yellow-300 underline transition-colors"
                >
                  Unicode CLDR
                </a>
                , and{' '}
                <a
                  href="https://unicode-org.github.io/icu/userguide/format_parse/messages/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-400 hover:text-yellow-300 underline transition-colors"
                >
                  ICU Message syntax
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
