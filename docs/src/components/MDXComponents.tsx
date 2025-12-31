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
      className="text-4xl font-bold mt-8 mb-6 text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hover:[&_.header-link]:visible"
    >
      {props.children}
    </h1>
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      id={props.id}
      className="text-3xl font-bold mt-10 mb-4 text-white hover:[&_.header-link]:visible border-b border-purple-500/20 pb-3"
    >
      {props.children}
    </h2>
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      id={props.id}
      className="text-2xl font-semibold mt-8 mb-3 text-purple-300 hover:[&_.header-link]:visible"
    >
      {props.children}
    </h3>
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4
      id={props.id}
      className="text-xl font-semibold mt-6 mb-2 text-purple-200 hover:[&_.header-link]:visible"
    >
      {props.children}
    </h4>
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-4 leading-7 text-gray-300">{props.children}</p>
  ),
  code: (
    props: React.HTMLAttributes<HTMLElement> & {live?: boolean | string}
  ) => {
    const {className, children} = props
    const isInline = !className

    if (isInline) {
      return (
        <code className="px-2 py-1 rounded-md bg-purple-900/30 text-purple-300 font-mono text-sm border border-purple-500/20">
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

      const code = extractText(
        (child?.props as {children?: any})?.children
      ).replace(/\n$/, '')
      const className = (child?.props as {className?: string})?.className || ''
      const language = className.replace(/language-/g, '').trim() || 'tsx'

      return <LiveCodeBlock code={code} language={language} />
    }

    return (
      <pre className="relative group p-5 mb-6 overflow-auto bg-gradient-to-br from-gray-900 to-gray-950 text-gray-200 rounded-lg border border-purple-500/20 shadow-xl hover:border-purple-500/40 transition-colors">
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
          className="header-link invisible ml-2 text-purple-400 no-underline text-sm hover:text-purple-300 transition-colors"
        >
          {props.children}
        </a>
      )
    }

    return (
      <a
        href={props.href}
        className="text-purple-400 hover:text-purple-300 underline decoration-purple-500/50 hover:decoration-purple-400 transition-colors"
      >
        {props.children}
      </a>
    )
  },
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="pl-6 mb-4 list-disc marker:text-purple-400 space-y-2">
      {props.children}
    </ul>
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="pl-6 mb-4 list-decimal marker:text-purple-400 space-y-2">
      {props.children}
    </ol>
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="mb-2 text-gray-300">{props.children}</li>
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="border-l-4 border-purple-500 pl-6 py-3 my-6 bg-purple-900/20 rounded-r-lg backdrop-blur-sm">
      {props.children}
    </blockquote>
  ),
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-purple-500/20 shadow-xl">
      <table className="min-w-full border-collapse">{props.children}</table>
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 backdrop-blur-sm">
      {props.children}
    </thead>
  ),
  tbody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className="bg-gray-950/50">{props.children}</tbody>
  ),
  tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className="border-b border-purple-500/10 hover:bg-purple-900/10 transition-colors">
      {props.children}
    </tr>
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="px-4 py-3 text-left font-bold text-purple-300 border-r border-purple-500/10 last:border-r-0">
      {props.children}
    </th>
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-4 py-3 text-gray-300 border-r border-purple-500/10 last:border-r-0">
      {props.children}
    </td>
  ),
}
