import {spawn} from 'node:child_process'
import {join} from 'node:path'
import {createInterface} from 'node:readline'

import {outputFile} from 'fs-extra/esm'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  'workspace-root'?: string
  'dry-run'?: boolean
}

interface RuleAttribute {
  name: string
  stringValue?: string
}

interface RuleJson {
  type: string
  rule?: {
    name: string
    ruleClass: string
    attribute?: RuleAttribute[]
  }
}

const PACKAGE_FILES_QUERY =
  'kind("_tsconfig_file rule", //packages/...:*) union kind("_package_json_file rule", //packages/...:*)'

function getWorkspaceRoot(args: Args): string {
  const dir = args['workspace-root'] ?? process.env.BUILD_WORKSPACE_DIRECTORY
  if (!dir) {
    throw new Error(
      '--workspace-root or BUILD_WORKSPACE_DIRECTORY is required. Run via `bazel run` or set it explicitly.'
    )
  }
  return dir
}

function parseLabel(label: string): {packageName: string; targetName: string} {
  const trimmed = label.startsWith('//') ? label.slice(2) : label
  const colonIdx = trimmed.indexOf(':')
  const packageName = colonIdx >= 0 ? trimmed.slice(0, colonIdx) : ''
  const targetName = colonIdx >= 0 ? trimmed.slice(colonIdx + 1) : ''

  if (!packageName || !targetName) {
    throw new Error(`Unexpected package file rule label: ${label}`)
  }

  return {packageName, targetName}
}

function labelToPath(label: string, ruleClass: string): string {
  const {packageName, targetName} = parseLabel(label)

  if (ruleClass === '_tsconfig_file') {
    if (targetName !== 'tsconfig_json_unformatted') {
      throw new Error(`Unexpected tsconfig rule label: ${label}`)
    }
    return join(packageName, 'tsconfig.json')
  }

  if (ruleClass === '_package_json_file') {
    if (targetName !== 'package_json_generated') {
      throw new Error(`Unexpected package.json rule label: ${label}`)
    }
    return join(packageName, 'package.json')
  }

  throw new Error(`Unexpected package file rule class: ${ruleClass}`)
}

function parsePackageFileLine(
  line: string
): {path: string; content: string} | null {
  if (!line.startsWith('{')) {
    return null
  }

  const parsed = JSON.parse(line) as RuleJson
  const ruleClass = parsed.rule?.ruleClass
  if (
    parsed.type !== 'RULE' ||
    (ruleClass !== '_tsconfig_file' && ruleClass !== '_package_json_file')
  ) {
    return null
  }

  const label = parsed.rule.name
  if (!label) {
    return null
  }

  const contentAttr = parsed.rule.attribute?.find(a => a.name === 'content')
  if (!contentAttr?.stringValue) {
    return null
  }

  return {
    path: labelToPath(label, ruleClass),
    content: JSON.stringify(JSON.parse(contentAttr.stringValue), null, 2),
  }
}

async function main(): Promise<void> {
  const args = minimist<Args>(process.argv.slice(2))
  const dryRun = args['dry-run'] === true
  const workspaceRoot = getWorkspaceRoot(args)

  process.stderr.write('Querying package file rules...\n')

  const bazel = spawn(
    'bazel',
    ['query', PACKAGE_FILES_QUERY, '--output=streamed_jsonproto'],
    {cwd: workspaceRoot, stdio: ['ignore', 'pipe', 'inherit']}
  )
  const rl = createInterface({input: bazel.stdout})

  const writes: Promise<void>[] = []
  let total = 0

  for await (const line of rl) {
    const result = parsePackageFileLine(line)
    if (!result) {
      continue
    }

    total++

    if (dryRun) {
      process.stdout.write(`Would write: ${result.path}\n`)
    } else {
      const fullPath = join(workspaceRoot, result.path)
      const json = result.content.endsWith('\n')
        ? result.content
        : `${result.content}\n`
      const header = result.path.endsWith('/tsconfig.json')
        ? '// Generated, DO NOT EDIT MANUALLY. To update, run "bazel run //:generate_package_files"\n'
        : ''
      writes.push(outputFile(fullPath, header + json))
    }
  }

  const exitCode = await new Promise<number | null>((resolve, reject) => {
    bazel.on('error', reject)
    bazel.on('close', code => resolve(code))
  })

  if (exitCode !== 0) {
    process.stderr.write(`bazel query failed with exit code ${exitCode}\n`)
    process.exit(exitCode ?? 1)
  }

  if (total === 0) {
    process.stderr.write('No package file rules found\n')
    process.exit(1)
  }

  await Promise.all(writes)

  const action = dryRun ? 'Would write' : 'Wrote'
  process.stderr.write(`${action} ${total} package files\n`)
}

main()
