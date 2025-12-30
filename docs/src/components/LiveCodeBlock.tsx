import * as React from 'react'
import {LiveProvider, LiveEditor, LiveError, LivePreview} from 'react-live'
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
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
      <Box sx={{my: 3}}>
        <Accordion defaultExpanded disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Live Editor</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{p: 0}}>
            <Box
              sx={{
                bgcolor: '#2d2d2d',
                '& > div': {
                  margin: 0,
                },
                '& textarea, & pre': {
                  fontFamily:
                    'Consolas, Monaco, "Courier New", monospace !important',
                  fontSize: '0.875em',
                  padding: '16px',
                  margin: 0,
                  backgroundColor: '#2d2d2d !important',
                  color: '#ccc',
                },
              }}
            >
              <LiveEditor />
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Result</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              sx={{
                color: 'grey.100',
              }}
            >
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
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    </LiveProvider>
  )
}
