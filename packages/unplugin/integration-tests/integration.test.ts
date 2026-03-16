import {join} from 'path'
import {mkdtempSync} from 'fs'
import {tmpdir} from 'os'
import {build as viteBuild} from 'vite'
import {rollup} from 'rollup'
import {build as esbuildBuild} from 'esbuild'
import webpack from 'webpack'
import {rspack} from '@rspack/core'
import {describe, expect, test} from 'vitest'

import vitePlugin from '@formatjs/unplugin/vite'
import rollupPlugin from '@formatjs/unplugin/rollup'
import esbuildPlugin from '@formatjs/unplugin/esbuild'
import webpackPlugin from '@formatjs/unplugin/webpack'
import rspackPlugin from '@formatjs/unplugin/rspack'
import type {Options} from '@formatjs/unplugin'

function fixturePath(name: string): string {
  return join(import.meta.dirname, 'fixtures', name)
}

// ─── Vite ─────────────────────────────────────────────────────────────────────

async function buildWithVite(
  fixture: string,
  options: Options = {}
): Promise<string> {
  const outDir = mkdtempSync(join(tmpdir(), 'unplugin-vite-'))
  const result = await viteBuild({
    root: import.meta.dirname,
    mode: 'production',
    logLevel: 'silent',
    build: {
      write: false,
      lib: {
        entry: fixturePath(fixture),
        formats: ['es'],
      },
      rolldownOptions: {
        external: ['react', 'react-intl'],
      },
      minify: false,
      outDir,
    },
    plugins: [vitePlugin(options)],
  })

  const output = Array.isArray(result) ? result[0] : result
  if ('output' in output) {
    const chunk = output.output.find(
      (o: any) => o.type === 'chunk' && o.isEntry
    ) as any
    return chunk?.code ?? ''
  }
  throw new Error('Unexpected Vite build result')
}

// ─── Rollup ───────────────────────────────────────────────────────────────────

async function buildWithRollup(
  fixture: string,
  options: Options = {}
): Promise<string> {
  const bundle = await rollup({
    input: fixturePath(fixture),
    plugins: [rollupPlugin(options)],
    onwarn: () => {},
  })
  const {output} = await bundle.generate({format: 'es'})
  await bundle.close()
  return output[0].code
}

// ─── esbuild ──────────────────────────────────────────────────────────────────

async function buildWithEsbuild(
  fixture: string,
  options: Options = {}
): Promise<string> {
  const result = await esbuildBuild({
    entryPoints: [fixturePath(fixture)],
    bundle: true,
    write: false,
    format: 'esm',
    plugins: [esbuildPlugin(options)],
  })
  return result.outputFiles[0].text
}

// ─── Webpack ──────────────────────────────────────────────────────────────────

async function buildWithWebpack(
  fixture: string,
  options: Options = {}
): Promise<string> {
  const outDir = mkdtempSync(join(tmpdir(), 'unplugin-webpack-'))
  return new Promise((resolve, reject) => {
    const compiler = webpack({
      mode: 'production',
      entry: fixturePath(fixture),
      output: {
        path: outDir,
        filename: 'bundle.js',
        library: {type: 'module'},
      },
      experiments: {outputModule: true},
      optimization: {minimize: false},
      plugins: [webpackPlugin(options)],
    })
    compiler.run((err, stats) => {
      if (err) return reject(err)
      if (stats?.hasErrors()) return reject(new Error(stats.toString()))
      const {readFileSync} = require('fs')
      const code = readFileSync(join(outDir, 'bundle.js'), 'utf-8')
      compiler.close(() => {})
      resolve(code)
    })
  })
}

// ─── Rspack ───────────────────────────────────────────────────────────────────

async function buildWithRspack(
  fixture: string,
  options: Options = {}
): Promise<string> {
  const outDir = mkdtempSync(join(tmpdir(), 'unplugin-rspack-'))
  return new Promise((resolve, reject) => {
    const compiler = rspack({
      mode: 'production',
      entry: fixturePath(fixture),
      output: {
        path: outDir,
        filename: 'bundle.js',
        library: {type: 'module'},
      },
      experiments: {outputModule: true},
      optimization: {minimize: false},
      plugins: [rspackPlugin(options)],
    })
    compiler.run((err, stats) => {
      if (err) return reject(err)
      if (stats?.hasErrors()) return reject(new Error(stats.toString()))
      const {readFileSync} = require('fs')
      const code = readFileSync(join(outDir, 'bundle.js'), 'utf-8')
      compiler.close(() => {})
      resolve(code)
    })
  })
}

// ─── Test suites ──────────────────────────────────────────────────────────────

const bundlers = [
  {name: 'vite', build: buildWithVite},
  {name: 'rollup', build: buildWithRollup},
  {name: 'esbuild', build: buildWithEsbuild},
  {name: 'webpack', build: buildWithWebpack},
  {name: 'rspack', build: buildWithRspack},
] as const

for (const {name, build} of bundlers) {
  describe(`@formatjs/unplugin — ${name}`, () => {
    test('generates ids and removes descriptions', async () => {
      const code = await build('formatMessage.js')
      expect(code).toMatchSnapshot()
    })

    test('removeDefaultMessage option', async () => {
      const code = await build('formatMessage.js', {
        removeDefaultMessage: true,
      })
      expect(code).toMatchSnapshot()
    })

    test('ast option pre-parses defaultMessage', async () => {
      const code = await build('defineMessage.js', {ast: true})
      expect(code).toMatchSnapshot()
    })
  })
}
