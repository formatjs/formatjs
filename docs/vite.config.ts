import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import vike from 'vike/plugin'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrismPlus from 'rehype-prism-plus'
import rehypeMdxCodeProps from 'rehype-mdx-code-props'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  publicDir: 'public',
  css: {
    transformer: 'lightningcss',
  },
  ssr: {
    noExternal: ['@mui/material', '@mui/utils'],
  },
  plugins: [
    tailwindcss(),
    vike({
      prerender: true,
    }),
    {
      enforce: 'pre',
      ...mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [remarkGfm, remarkFrontmatter],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: 'append',
              properties: {
                className: ['header-link'],
              },
              content: {
                type: 'text',
                value: '#',
              },
            },
          ],
          rehypeMdxCodeProps,
          [rehypePrismPlus, {ignoreMissing: true}],
        ],
      }),
    },
    react(),
  ],
  server: {
    port: 3000,
    open: true,
  },
})
