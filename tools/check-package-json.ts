import {readJSONSync} from 'fs-extra'
import minimist from 'minimist'
import {isEqual} from 'lodash'
import stringify from 'json-stable-stringify'
const unidiff = require('unidiff')

interface Args {
  packageJson: string
  rootPackageJson: string
  out: string
  internalDep: string | string[]
  externalDep: string | string[]
}

const cmp: stringify.Comparator = (a, b) => (a.key < b.key ? 1 : -1)

function main(args: Args) {
  const {externalDep, internalDep, packageJson, rootPackageJson} = args
  const externalDeps = Array.isArray(externalDep)
    ? externalDep
    : externalDep
    ? [externalDep]
    : []
  const internalDeps = Array.isArray(internalDep)
    ? internalDep
    : internalDep
    ? [internalDep]
    : []
  const packageJsonContent = readJSONSync(packageJson)
  const rootPackageJsonContent = readJSONSync(rootPackageJson)
  const {devDependencies: rootDependencies} = rootPackageJsonContent
  const expectedDependencies: Record<string, string> = {
    tslib: rootDependencies.tslib,
    ...externalDeps.reduce((all: Record<string, string>, dep) => {
      all[dep] = rootDependencies[dep]
      return all
    }, {}),
  }
  const packageJsonAllDeps = {
    ...packageJsonContent.dependencies,
    ...(packageJsonContent.peerDependencies || {}),
  }
  internalDeps.forEach(pkg => {
    delete packageJsonAllDeps[pkg]
  })
  if (packageJsonContent.peerDependenciesMeta) {
    for (const dep in packageJsonContent.peerDependenciesMeta) {
      delete expectedDependencies[dep]
      delete packageJsonAllDeps[dep]
    }
  }

  if (isEqual(packageJsonAllDeps, expectedDependencies)) {
    return
  }

  const diff = unidiff.diffLines(
    stringify(packageJsonAllDeps, {space: 2, cmp}),
    stringify(expectedDependencies, {space: 2, cmp})
  )
  console.log(
    'package.json dependencies versions differs from root package.json'
  )
  console.log(unidiff.formatLines(diff))

  process.exit(1)
}

if (require.main === module) {
  main(minimist<Args>(process.argv.slice(2)))
}
