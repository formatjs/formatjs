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

// Dark theme matching prism-tomorrow
const darkTheme = {
  plain: {
    color: '#ccc',
    backgroundColor: '#2d2d2d',
  },
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: {
        color: '#999',
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
        color: '#e6db74',
      },
    },
    {
      types: ['punctuation', 'operator'],
      style: {
        color: '#ccc',
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
        color: '#ae81ff',
      },
    },
    {
      types: ['atrule', 'keyword', 'attr-name', 'selector'],
      style: {
        color: '#66d9ef',
      },
    },
    {
      types: ['function', 'deleted', 'tag'],
      style: {
        color: '#fd971f',
      },
    },
    {
      types: ['function-variable'],
      style: {
        color: '#fd971f',
      },
    },
    {
      types: ['tag', 'selector', 'keyword'],
      style: {
        color: '#f92672',
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

  // Check if code is already JSX (starts with <)
  const isJSX = trimmedCode.startsWith('<')

  // Wrap non-JSX code in a fragment to render the result
  const transformedCode = isJSX ? trimmedCode : `<>{${trimmedCode}}</>`

  return (
    <LiveProvider
      code={transformedCode}
      scope={scope}
      language={language}
      theme={darkTheme}
    >
      <div className="my-6 space-y-2">
        <Accordion type="multiple" defaultValue={['editor', 'result']}>
          <AccordionItem value="editor">
            <AccordionTrigger className="text-base font-medium">
              Live Editor
            </AccordionTrigger>
            <AccordionContent className="p-0">
              <div className="bg-[#2d2d2d] [&>div]:m-0 [&_textarea]:font-mono [&_textarea]:text-sm [&_textarea]:p-4 [&_textarea]:m-0 [&_textarea]:bg-[#2d2d2d] [&_textarea]:text-[#ccc] [&_pre]:font-mono [&_pre]:text-sm [&_pre]:p-4 [&_pre]:m-0 [&_pre]:bg-[#2d2d2d] [&_pre]:text-[#ccc]">
                <LiveEditor />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="result">
            <AccordionTrigger className="text-base font-medium">
              Result
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-foreground">
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
                    margin: '8px 0 0 0',
                    padding: '8px',
                    backgroundColor: 'rgba(211, 47, 47, 0.2)',
                    color: '#f44336',
                    borderRadius: '4px',
                    border: '1px solid rgba(211, 47, 47, 0.5)',
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
