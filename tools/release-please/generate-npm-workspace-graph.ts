import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname} from 'node:path'

import minimist from 'minimist'

import {normalizePackage} from './npm-workspace-graph.ts'

interface Args extends minimist.ParsedArgs {
  out?: string
  package?: string | string[]
}

interface ValidatedArgs {
  out: string
  packages: string[]
}

function packageArgs(args: Args): string[] {
  return ([] as string[]).concat(args.package || [])
}

export function validateArgs(args: Args): ValidatedArgs {
  if (!args.out) {
    throw new Error(
      'Usage: generate-npm-workspace-graph --out <file> --package <path=package.json>...'
    )
  }

  return {out: args.out, packages: packageArgs(args)}
}

export function parsePackageArg(value: string): {
  path: string
  packageJson: string
} {
  const separator = value.indexOf('=')
  if (separator === -1) {
    throw new Error(`Package argument must be <path=package.json>: ${value}`)
  }
  return {
    path: value.slice(0, separator),
    packageJson: value.slice(separator + 1),
  }
}

export function main(args: Args) {
  const {out, packages: packagePaths} = validateArgs(args)
  const packages = packagePaths.map(value => {
    const {path, packageJson} = parsePackageArg(value)
    const manifest = JSON.parse(readFileSync(packageJson, 'utf8'))
    return normalizePackage({
      path,
      name: manifest.name,
      version: manifest.version,
      dependencies: manifest.dependencies,
      optionalDependencies: manifest.optionalDependencies,
      peerDependencies: manifest.peerDependencies,
    })
  })

  mkdirSync(dirname(out), {recursive: true})
  writeFileSync(out, `${JSON.stringify({packages}, null, 2)}\n`)
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
