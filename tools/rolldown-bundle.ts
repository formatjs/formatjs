/**
 * Rolldown bundler script for Bazel.
 * Replaces esbuild for JS bundling with #packages/* workspace resolution.
 *
 * Usage: rolldown-bundle --input <entry.ts> --output <out.js> --format esm
 *        [--external pkg1 --external pkg2] [--target es2020]
 *        [--globalName Name] [--platform browser|node] [--entryFileNames name]
 */
import {rolldown} from 'rolldown'
import {dts} from 'rolldown-plugin-dts'
import path from 'node:path'
import {writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  input: string
  output?: string
  outDir?: string
  format?: string
  external?: string | string[]
  target?: string
  globalName?: string
  platform?: string
  entryFileNames?: string
  define?: string | string[]
  dts?: boolean
}

function getWorkspaceRoot(): string {
  if (process.env.BUILD_WORKSPACE_DIRECTORY)
    return process.env.BUILD_WORKSPACE_DIRECTORY
  if (process.env.JS_BINARY__EXECROOT && process.env.BAZEL_BINDIR)
    return path.join(process.env.JS_BINARY__EXECROOT, process.env.BAZEL_BINDIR)
  if (process.env.JS_BINARY__RUNFILES && process.env.JS_BINARY__WORKSPACE)
    return path.join(
      process.env.JS_BINARY__RUNFILES,
      process.env.JS_BINARY__WORKSPACE
    )
  return process.cwd()
}

async function main(args: Args) {
  const {input, output, outDir, globalName, platform} = args
  const format: 'es' | 'cjs' | 'iife' =
    args.format === 'esm'
      ? 'es'
      : (args.format as 'es' | 'cjs' | 'iife') || 'es'
  const externals: string[] = [].concat(args.external || [])
  const target: string = args.target || 'es2020'
  const defines: string[] = [].concat(args.define || [])

  if (!input || (!output && !outDir)) {
    throw new Error(
      'Usage: rolldown-bundle --input <entry> --output <out>|--outDir <dir> [--format esm] [--external pkg]'
    )
  }

  const workspaceRoot = getWorkspaceRoot()

  // Parse --define key=value pairs
  const defineMap: Record<string, string> = {}
  for (const d of defines) {
    const eq = d.indexOf('=')
    if (eq > 0) defineMap[d.slice(0, eq)] = d.slice(eq + 1)
  }

  // Convert externals to regex patterns that match subpath imports
  const externalPatterns: Array<string | RegExp> = externals.map(ext => {
    const escaped = ext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`^${escaped}(\\/.*)?$`)
  })

  // Write a temp tsconfig so the oxc resolver can resolve #packages/* paths
  // with proper TypeScript extension mapping (.js -> .ts/.tsx)
  const tsconfigPath = path.join(
    tmpdir(),
    `rolldown-tsconfig-${process.pid}.json`
  )
  writeFileSync(
    tsconfigPath,
    JSON.stringify({
      compilerOptions: {
        baseUrl: workspaceRoot,
        paths: {
          '#packages/*': ['packages/*'],
        },
        ...(args.dts ? {isolatedDeclarations: true} : {}),
      },
    })
  )

  const bundle = await rolldown({
    input,
    external: externalPatterns,
    plugins: args.dts ? dts({tsconfig: tsconfigPath}) : [],
    platform:
      platform === 'node'
        ? 'node'
        : platform === 'browser'
          ? 'browser'
          : 'neutral',
    define: Object.keys(defineMap).length > 0 ? defineMap : undefined,
    resolve: {
      tsconfigFilename: tsconfigPath,
    },
  })

  // Polyfill CJS globals (__filename, __dirname) when bundling for Node.js ESM.
  // Required when bundled dependencies (e.g., TypeScript compiler) use these globals.
  const banner =
    platform === 'node' && format !== 'cjs'
      ? 'import{fileURLToPath as _furl}from"node:url";import{dirname as _dname}from"node:path";const __filename=_furl(import.meta.url);const __dirname=_dname(__filename);'
      : undefined

  if (outDir) {
    await bundle.write({
      dir: outDir,
      format,
      sourcemap: true,
      name: globalName,
      target,
      banner,
      entryFileNames: args.entryFileNames,
    })
  } else if (output) {
    if (args.dts) {
      // dts plugin generates multiple chunks, requiring dir mode
      const dir = path.dirname(output)
      await bundle.write({
        dir: dir || '.',
        format,
        sourcemap: true,
        name: globalName,
        target,
        banner,
      })
    } else {
      await bundle.write({
        file: output,
        format,
        sourcemap: true,
        name: globalName,
        target,
        banner,
      })
    }
  }
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
