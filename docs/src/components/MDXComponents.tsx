import * as React from 'react'
import type {MDXProvider} from '@mdx-js/react'
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
    <h1
      id={props.id}
      className="text-3xl font-bold mt-8 mb-4 hover:[&_.header-link]:visible"
    >
      {props.children}
    </h1>
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      id={props.id}
      className="text-2xl font-bold mt-6 mb-3 hover:[&_.header-link]:visible"
    >
      {props.children}
    </h2>
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      id={props.id}
      className="text-xl font-semibold mt-4 mb-2 hover:[&_.header-link]:visible"
    >
      {props.children}
    </h3>
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4
      id={props.id}
      className="text-lg font-semibold mt-4 mb-2 hover:[&_.header-link]:visible"
    >
      {props.children}
    </h4>
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-4 leading-7">{props.children}</p>
  ),
  code: (
    props: React.HTMLAttributes<HTMLElement> & {live?: boolean | string}
  ) => {
    const {className, children, live, ...rest} = props
    const isInline = !className

    if (isInline) {
      return (
        <code className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-sm">
          {children}
        </code>
      )
    }

    // Non-inline code blocks are handled by the pre component
    // which checks for the live prop and renders LiveCodeBlock if needed
    return <code className="font-mono text-sm">{children}</code>
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
      <pre className="p-4 mb-4 overflow-auto bg-[#2d2d2d] text-gray-200 rounded-md">
        {props.children}
      </pre>
    )
  },
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    // Check if this is a header link
    const isHeaderLink = props.className?.includes('header-link')

    if (isHeaderLink) {
      return (
        <a
          href={props.href}
          className="header-link invisible ml-2 text-primary no-underline text-sm"
        >
          {props.children}
        </a>
      )
    }

    return (
      <a href={props.href} className="text-primary hover:underline">
        {props.children}
      </a>
    )
  },
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="pl-6 mb-4 list-disc">{props.children}</ul>
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="pl-6 mb-4 list-decimal">{props.children}</ol>
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="mb-2">{props.children}</li>
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 bg-muted">
      {props.children}
    </blockquote>
  ),
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 overflow-x-auto">
      <table className="min-w-full border-collapse border border-border">
        {props.children}
      </table>
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-muted">{props.children}</thead>
  ),
  tbody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody>{props.children}</tbody>
  ),
  tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className="border-b border-border">{props.children}</tr>
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="px-4 py-2 text-left font-bold border border-border">
      {props.children}
    </th>
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-4 py-2 border border-border">{props.children}</td>
  ),
}
