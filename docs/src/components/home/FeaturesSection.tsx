import * as React from 'react'

export default function FeaturesSection(): React.ReactNode {
  return (
    <div className="bg-background pt-12 pb-8 md:pt-16 md:pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* First column - Stacked colored boxes on top, text below */}
          <div>
            <div className="grid grid-cols-1 mb-6">
              <div className="bg-primary p-3 flex items-center justify-center min-h-[50px]">
                <p className="uppercase text-sm text-primary-foreground">
                  FormatJS Integrations
                </p>
              </div>
              <div
                className="p-3 flex items-center justify-center min-h-[50px]"
                style={{backgroundColor: '#8339c2'}}
              >
                <p className="uppercase text-sm text-white">
                  FormatJS Core Libs
                </p>
              </div>
              <div className="bg-yellow-400 p-3 flex items-center justify-center min-h-[50px]">
                <p className="uppercase text-sm text-black">
                  ECMA-402 + FormatJS Polyfills
                </p>
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-semibold mb-4">
              FormatJS is a set of JavaScript libraries.
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              FormatJS is a modular collection of JavaScript libraries for
              internationalization that are focused on formatting numbers,
              dates, and strings for displaying to people. It includes a set of
              core libraries that build on the JavaScript Intl built-ins and
              industry-wide i18n standards, plus a set of integrations for
              common template and component libraries.
            </p>
          </div>

          {/* Middle-Right - Integrations with logos */}
          <div>
            <div className="flex gap-6 items-center justify-center min-h-[150px] mb-6">
              <img
                src="/img/react.svg"
                alt="React"
                className="max-h-[150px] max-w-[30%] object-contain"
              />
              <img
                src="/img/ember.svg"
                alt="Ember"
                className="max-h-[150px] max-w-[30%] object-contain"
              />
              <img
                src="/img/vue-logo.svg"
                alt="Vue"
                className="max-h-[150px] max-w-[30%] object-contain"
              />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">
              Integrates with other libraries.
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              For most web projects, internationalization happens in the
              template or view layer, so we've built integrations with React &
              Vue.
            </p>
          </div>

          {/* Right - JS logo and Built on standards */}
          <div>
            <div className="flex items-center justify-center min-h-[150px] mb-6">
              <img
                src="/img/js.svg"
                alt="JavaScript"
                className="h-[150px] w-[150px]"
              />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">
              Built on standards.
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              FormatJS is aligned with:{' '}
              <a
                href="https://tc39.es/ecma402/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                ECMAScript
              </a>
              ,{' '}
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Internationalization API (ECMA-402)
              </a>
              ,{' '}
              <a
                href="http://cldr.unicode.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Unicode CLDR
              </a>
              , and{' '}
              <a
                href="https://unicode-org.github.io/icu/userguide/format_parse/messages/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                ICU Message syntax
              </a>
              . By building on these industry standards, FormatJS works on the
              web and works in modern browsers and works with the message syntax
              used by professional translators.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
