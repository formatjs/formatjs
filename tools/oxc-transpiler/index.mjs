#!/usr/bin/env node
/**
 * Simple wrapper for oxc-transform to use with Bazel ts_project transpiler attribute
 * Only generates JS files - d.ts files are handled by tsc
 */

import {transformSync} from 'oxc-transform'
import {readFileSync, existsSync} from 'fs'
import {outputFileSync} from 'fs-extra/esm'
import {extname} from 'path'

// Parse command line args
const args = process.argv.slice(2)

// Args come in pairs: input_file output_file
if (args.length % 2 !== 0) {
  console.error('Error: Arguments must come in pairs (input output)')
  process.exit(1)
}

// Process each file pair
for (let i = 0; i < args.length; i += 2) {
  const inputFile = args[i]
  const outputFile = args[i + 1]

  try {
    // js_binary sets CWD to BAZEL_BINDIR, but paths are relative to execroot
    // We need to navigate back to execroot from the bin directory
    const cwd = process.cwd()
    const binDir =
      process.env.BAZEL_BINDIR || 'bazel-out/darwin_arm64-fastbuild/bin'

    // Calculate how to get back to execroot from current CWD
    // If CWD ends with binDir, we need to go up by the depth of binDir
    const pathToExecroot = cwd.endsWith(binDir) ? '../../../' : ''

    const resolvedInputPath = pathToExecroot + inputFile

    if (!existsSync(resolvedInputPath)) {
      console.error(`Error: Cannot find file: ${inputFile}`)
      console.error(`Tried: ${resolvedInputPath}`)
      console.error(`CWD: ${cwd}`)
      console.error(`BAZEL_BINDIR: ${binDir}`)
      process.exit(1)
    }

    const code = readFileSync(resolvedInputPath, 'utf-8')
    const ext = extname(resolvedInputPath)
    const isTypeScript = ext === '.ts' || ext === '.tsx'

    if (!isTypeScript) {
      // Skip non-TypeScript files
      continue
    }

    // Transform with oxc to JavaScript and declaration files
    // Determine language based on file extension
    const lang = ext === '.tsx' ? 'tsx' : 'ts'
    const result = transformSync(resolvedInputPath, code, {
      lang: lang,
      sourcemap: false,
      typescript: {
        onlyRemoveTypeImports: true,
        declaration: true,
      },
    })

    if (!result || !result.code) {
      console.error(
        `Error: oxc-transform returned no output for ${resolvedInputPath}`
      )
      process.exit(1)
    }

    // Rewrite relative .ts/.tsx imports to .js (equivalent to rewriteRelativeImportExtensions)
    // This transforms: import './types.ts' -> import './types.js'
    // Only affects relative imports (starting with ./ or ../)
    let outputCode = result.code.replace(
      /((?:import|export)\s+(?:(?:[\w{}\s*,]+)\s+from\s+)?["'])(\.\.?\/[^"']+)(\.ts)(x?)(["'])/g,
      '$1$2.js$5'
    )

    // Also handle dynamic imports: import('./types.ts') -> import('./types.js')
    outputCode = outputCode.replace(
      /(import\s*\(\s*["'])(\.\.?\/[^"']+)(\.ts)(x?)(["']\s*\))/g,
      '$1$2.js$5'
    )

    // Resolve output path the same way as input
    const resolvedOutputPath = pathToExecroot + outputFile

    // Write JS output to the specified output file (creates directories automatically)
    outputFileSync(resolvedOutputPath, outputCode, 'utf-8')

    // Write .d.ts file if declaration was generated
    if (result.declaration) {
      const dtsPath = resolvedOutputPath.replace(/\.js$/, '.d.ts')
      outputFileSync(dtsPath, result.declaration, 'utf-8')
    }
  } catch (error) {
    console.error(`Error transpiling ${inputFile}:`, error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}
