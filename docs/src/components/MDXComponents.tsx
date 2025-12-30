import * as React from 'react'
import type {MDXProvider} from '@mdx-js/react'
import {
  Typography,
  Link,
  Paper,
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from '@mui/material'
import Tabs from '../theme/Tabs'
import TabItem from '../theme/TabItem'
import Admonition from './Admonition'
import {IcuEditor} from './IcuEditor'
import {LiveCodeBlock} from './LiveCodeBlock'

// Extract MDXComponents type from MDXProvider props
type MDXProviderProps = React.ComponentProps<typeof MDXProvider>
type MDXComponents = NonNullable<
  Exclude<MDXProviderProps['components'], Function>
>

// Custom components for MDX
export const mdxComponents: MDXComponents = {
  Tabs,
  TabItem,
  Admonition,
  IcuEditor,
  LiveCodeBlock,
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <Typography
      variant="h3"
      component="h1"
      gutterBottom
      id={props.id}
      sx={{
        mt: 4,
        mb: 2,
        '&:hover .header-link': {
          visibility: 'visible !important',
        },
      }}
    >
      {props.children}
    </Typography>
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <Typography
      variant="h4"
      component="h2"
      gutterBottom
      id={props.id}
      sx={{
        mt: 3,
        mb: 2,
        '&:hover .header-link': {
          visibility: 'visible !important',
        },
      }}
    >
      {props.children}
    </Typography>
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <Typography
      variant="h5"
      component="h3"
      gutterBottom
      id={props.id}
      sx={{
        mt: 2,
        mb: 1,
        '&:hover .header-link': {
          visibility: 'visible !important',
        },
      }}
    >
      {props.children}
    </Typography>
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <Typography
      variant="h6"
      component="h4"
      gutterBottom
      id={props.id}
      sx={{
        mt: 2,
        mb: 1,
        '&:hover .header-link': {
          visibility: 'visible !important',
        },
      }}
    >
      {props.children}
    </Typography>
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <Typography variant="body1" paragraph>
      {props.children}
    </Typography>
  ),
  code: (
    props: React.HTMLAttributes<HTMLElement> & {live?: boolean | string}
  ) => {
    const {className, children, live, ...rest} = props
    const isInline = !className

    if (isInline) {
      return (
        <Box
          component="code"
          sx={{
            px: 0.75,
            py: 0.25,
            borderRadius: 0.5,
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            color: 'grey.300',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '0.875em',
          }}
        >
          {children}
        </Box>
      )
    }

    // Non-inline code blocks are handled by the pre component
    // which checks for the live prop and renders LiveCodeBlock if needed
    return (
      <code
        style={{
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          fontSize: '0.875em',
        }}
      >
        {children}
      </code>
    )
  },
  pre: (props: React.HTMLAttributes<HTMLPreElement> & {live?: boolean}) => {
    // Check if the code block is a live block
    const child = React.Children.only(props.children) as React.ReactElement
    const isLive = props.live === true

    // If it's a live block, render LiveCodeBlock directly
    if (isLive) {
      // Extract text content from potentially nested children (from syntax highlighter)
      const extractText = (node: any): string => {
        if (typeof node === 'string') return node
        if (typeof node === 'number') return String(node)
        if (Array.isArray(node)) return node.map(extractText).join('')
        if (node?.props?.children) return extractText(node.props.children)
        return ''
      }

      const code = extractText(child?.props?.children).replace(/\n$/, '')
      const className = child?.props?.className || ''
      const language = className.replace(/language-/g, '').trim() || 'tsx'

      return <LiveCodeBlock code={code} language={language} />
    }

    return (
      <Paper
        component="pre"
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          overflow: 'auto',
          bgcolor: 'grey.900',
          color: 'grey.50',
          borderRadius: 1,
        }}
      >
        {props.children}
      </Paper>
    )
  },
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    // Check if this is a header link
    const isHeaderLink = props.className?.includes('header-link')

    if (isHeaderLink) {
      return (
        <Box
          component="a"
          href={props.href}
          className="header-link"
          sx={{
            visibility: 'hidden',
            ml: 0.5,
            color: 'primary.main',
            textDecoration: 'none',
            fontSize: '0.8em',
          }}
        >
          {props.children}
        </Box>
      )
    }

    return (
      <Link href={props.href} color="primary">
        {props.children}
      </Link>
    )
  },
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <Typography component="ul" sx={{pl: 3, mb: 2}}>
      {props.children}
    </Typography>
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <Typography component="ol" sx={{pl: 3, mb: 2}}>
      {props.children}
    </Typography>
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <Typography component="li" sx={{mb: 0.5}}>
      {props.children}
    </Typography>
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <Paper
      component="blockquote"
      elevation={0}
      sx={{
        borderLeft: 4,
        borderColor: 'primary.main',
        pl: 2,
        py: 1,
        my: 2,
        bgcolor: 'grey.50',
      }}
    >
      {props.children}
    </Paper>
  ),
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <TableContainer component={Paper} elevation={0} sx={{my: 3}}>
      <Table sx={{minWidth: 650}}>{props.children}</Table>
    </TableContainer>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <TableHead>{props.children}</TableHead>
  ),
  tbody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <TableBody>{props.children}</TableBody>
  ),
  tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
    <TableRow>{props.children}</TableRow>
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <TableCell component="th" sx={{fontWeight: 'bold'}}>
      {props.children}
    </TableCell>
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <TableCell>{props.children}</TableCell>
  ),
}
