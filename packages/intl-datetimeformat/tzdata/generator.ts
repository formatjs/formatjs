import {spawnSync} from 'node:child_process'
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import {dirname, resolve} from 'node:path'

interface ZoneOutput {
  name: string
  output: string
}

interface Manifest {
  backward: {
    output: string
    source: string
  }
  sources: string[]
  zones: ZoneOutput[]
}

function run(command: string, args: string[], cwd?: string): string {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 1024 * 1024,
  })

  if (result.error) {
    throw result.error
  }
  if (result.stderr) {
    process.stderr.write(result.stderr)
  }
  if (result.status !== 0) {
    throw new Error(
      `${command} exited with status ${result.status}${
        result.signal ? ` (${result.signal})` : ''
      }`
    )
  }

  return result.stdout
}

function main() {
  const [manifestPath, zicPath, zdumpPath, workDirPath] = process.argv.slice(2)
  if (!manifestPath || !zicPath || !zdumpPath || !workDirPath) {
    throw new Error('expected manifest, zic, zdump, and work directory paths')
  }

  const execroot = process.cwd()
  const manifest = JSON.parse(
    readFileSync(resolve(execroot, manifestPath), 'utf8')
  ) as Manifest
  const zic = resolve(execroot, zicPath)
  const zdump = resolve(execroot, zdumpPath)
  const workDir = resolve(execroot, workDirPath)
  const zicDir = resolve(workDir, 'zic')

  rmSync(workDir, {force: true, recursive: true})
  mkdirSync(zicDir, {recursive: true})

  try {
    run(zic, [
      '-d',
      zicDir,
      ...manifest.sources.map(source => resolve(execroot, source)),
    ])

    const backwardOutput = resolve(execroot, manifest.backward.output)
    mkdirSync(dirname(backwardOutput), {recursive: true})
    copyFileSync(resolve(execroot, manifest.backward.source), backwardOutput)

    for (const zone of manifest.zones) {
      const output = resolve(execroot, zone.output)
      mkdirSync(dirname(output), {recursive: true})
      writeFileSync(
        output,
        run(zdump, ['-c', '2100', '-v', `zic/${zone.name}`], workDir)
      )
    }
  } finally {
    rmSync(workDir, {force: true, recursive: true})
    mkdirSync(workDir, {recursive: true})
  }
}

main()
