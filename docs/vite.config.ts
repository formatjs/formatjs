import {mkdir, readFile, writeFile} from 'node:fs/promises'
import {dirname, resolve} from 'node:path'
import {createServer, defineConfig, type Plugin} from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrismPlus from 'rehype-prism-plus'
import rehypeMdxCodeProps from 'rehype-mdx-code-props'
import tailwindcss from '@tailwindcss/vite'

function mdxPlugin(): Plugin {
  return {
    enforce: 'pre',
    ...mdx({
      development: false,
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
  }
}

function prerenderPages(): Plugin {
  let root: string
  let outputDirectory: string

  return {
    name: 'formatjs-prerender-pages',
    apply: 'build',
    configResolved(config) {
      root = config.root
      outputDirectory = resolve(root, config.build.outDir)
    },
    async closeBundle() {
      const server = await createServer({
        configFile: false,
        root,
        appType: 'custom',
        logLevel: 'error',
        plugins: [mdxPlugin(), react()],
        server: {middlewareMode: true},
        ssr: {noExternal: ['@mui/material', '@mui/utils']},
      })

      try {
        const {render} = await server.ssrLoadModule('/src/entry-server.tsx')
        const template = await readFile(
          resolve(outputDirectory, 'index.html'),
          'utf8'
        )
        const metadata = JSON.parse(
          await readFile(
            resolve(root, 'src/docs-metadata.generated.json'),
            'utf8'
          )
        ) as Record<string, {title: string; description: string}>

        for (const pathname of [
          '/',
          ...Object.keys(metadata).map(path => `/docs/${path}`),
        ]) {
          const {html, head} = render(pathname) as {
            html: string
            head: string
          }
          const output = template
            .replace('<title>FormatJS Documentation</title>', head)
            .replace('<div id="root"></div>', `<div id="root">${html}</div>`)
          const filename = resolve(
            outputDirectory,
            pathname === '/' ? 'index.html' : `${pathname.slice(1)}/index.html`
          )

          await mkdir(dirname(filename), {recursive: true})
          await writeFile(filename, output)
        }

        console.log(
          `Prerendered ${Object.keys(metadata).length + 1} static pages`
        )
      } finally {
        await server.close()
      }
    },
  }
}

export default defineConfig({
  publicDir: 'public',
  build: {
    outDir: 'dist/client',
  },
  css: {
    transformer: 'lightningcss',
  },
  ssr: {
    noExternal: ['@mui/material', '@mui/utils'],
  },
  plugins: [tailwindcss(), mdxPlugin(), react(), prerenderPages()],
  server: {
    port: 3000,
    open: true,
  },
})
