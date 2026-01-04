import * as React from 'react'
import {LiveProvider, LiveEditor, LiveError, LivePreview} from 'react-live'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'
import * as ReactIntl from 'react-intl'
import IntlMessageFormat from 'intl-messageformat'

// Scope available to live code blocks - matching website/src/theme/ReactLiveScope/index.js
// Explicitly list React exports to avoid issues with spread
const scope = {
  React,
  useState: React.useState,
  useEffect: React.useEffect,
  useContext: React.useContext,
  useMemo: React.useMemo,
  useCallback: React.useCallback,
  Fragment: React.Fragment,
  defineMessages: ReactIntl.defineMessages,

  // ReactIntl exports
  FormattedMessage: ReactIntl.FormattedMessage,
  FormattedDate: ReactIntl.FormattedDate,
  FormattedTime: ReactIntl.FormattedTime,
  FormattedNumber: ReactIntl.FormattedNumber,
  FormattedPlural: ReactIntl.FormattedPlural,
  FormattedRelativeTime: ReactIntl.FormattedRelativeTime,
  FormattedDateParts: ReactIntl.FormattedDateParts,
  FormattedTimeParts: ReactIntl.FormattedTimeParts,
  FormattedNumberParts: ReactIntl.FormattedNumberParts,
  FormattedDateTimeRange: ReactIntl.FormattedDateTimeRange,
  FormattedList: ReactIntl.FormattedList,
  FormattedDisplayName: ReactIntl.FormattedDisplayName,
  FormattedListParts: ReactIntl.FormattedListParts,
  IntlProvider: ReactIntl.IntlProvider,
  useIntl: ReactIntl.useIntl,
  IntlMessageFormat,
  intl: ReactIntl.createIntl({
    locale: typeof navigator !== 'undefined' ? navigator.language : 'en',
  }),
}

// Modern dark theme with purple accents
const darkTheme = {
  plain: {
    color: '#e2e8f0',
    backgroundColor: 'transparent',
  },
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: {
        color: '#64748b',
        fontStyle: 'italic' as const,
      },
    },
    {
      types: ['namespace'],
      style: {
        opacity: 0.7,
      },
    },
    {
      types: ['string', 'attr-value'],
      style: {
        color: '#a78bfa',
      },
    },
    {
      types: ['punctuation', 'operator'],
      style: {
        color: '#94a3b8',
      },
    },
    {
      types: [
        'entity',
        'url',
        'symbol',
        'number',
        'boolean',
        'variable',
        'constant',
        'property',
        'regex',
        'inserted',
      ],
      style: {
        color: '#c084fc',
      },
    },
    {
      types: ['atrule', 'keyword', 'attr-name', 'selector'],
      style: {
        color: '#60a5fa',
      },
    },
    {
      types: ['function', 'deleted', 'tag'],
      style: {
        color: '#f472b6',
      },
    },
    {
      types: ['function-variable'],
      style: {
        color: '#f472b6',
      },
    },
    {
      types: ['tag', 'selector', 'keyword'],
      style: {
        color: '#fb7185',
      },
    },
  ],
}

interface LiveCodeBlockProps {
  code: string
  language?: string
}

export function LiveCodeBlock({
  code,
  language = 'tsx',
}: LiveCodeBlockProps): React.ReactNode {
  const trimmedCode = code.trim()

  const transformCode = React.useCallback((code: string) => {
    // Check if code is already JSX (starts with <)
    const isJSX = code.startsWith('<')

    // Wrap non-JSX code in a fragment to render the result
    if (isJSX) {
      return code
    }
    // Last line is always the return value
    const lines = code.split('\n')
    const lastLine = lines.pop()
    return `<>{function(){${lines.join('\n')}
return ${lastLine}}()}</>`
  }, [])

  return (
    <LiveProvider
      code={trimmedCode}
      scope={scope}
      language={language}
      theme={darkTheme}
      transformCode={transformCode}
    >
      <div className="my-6 rounded-lg border border-purple-500/20 overflow-hidden bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
        <Accordion type="multiple" defaultValue={['editor', 'result']}>
          <AccordionItem
            value="editor"
            className="border-b border-purple-500/20"
          >
            <AccordionTrigger className="px-5 py-3 text-base font-semibold text-purple-300 hover:text-purple-200 hover:bg-purple-900/10 transition-colors">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                Live Editor
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-0">
              <div className="bg-gradient-to-br from-gray-950 to-gray-900 [&>div]:m-0 [&_textarea]:font-mono [&_textarea]:text-sm [&_textarea]:p-5 [&_textarea]:m-0 [&_textarea]:bg-transparent [&_textarea]:text-gray-200 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:p-5 [&_pre]:m-0 [&_pre]:bg-transparent [&_pre]:text-gray-200">
                <LiveEditor />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="result" className="border-0">
            <AccordionTrigger className="px-5 py-3 text-base font-semibold text-purple-300 hover:text-purple-200 hover:bg-purple-900/10 transition-colors">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Result
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 py-4 bg-purple-900/10">
              <div className="text-gray-200">
                <ReactIntl.IntlProvider
                  locale={
                    typeof navigator !== 'undefined' ? navigator.language : 'en'
                  }
                >
                  <LivePreview />
                </ReactIntl.IntlProvider>
                <LiveError
                  style={{
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '0.875em',
                    margin: '12px 0 0 0',
                    padding: '12px',
                    backgroundColor: 'rgba(220, 38, 38, 0.15)',
                    color: '#fca5a5',
                    borderRadius: '8px',
                    border: '1px solid rgba(220, 38, 38, 0.3)',
                  }}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </LiveProvider>
  )
}
