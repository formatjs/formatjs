/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

declare module '*.md' {
  import type {ComponentType} from 'react'
  const Component: ComponentType
  export default Component
  export const frontmatter: {
    id?: string
    title?: string
    [key: string]: any
  }
}

declare module '*.mdx' {
  import type {ComponentType} from 'react'
  const Component: ComponentType
  export default Component
  export const frontmatter: {
    id?: string
    title?: string
    [key: string]: any
  }
}
