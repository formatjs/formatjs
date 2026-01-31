import {execFile as _execFile} from 'child_process'
import {promisify} from 'util'
import minimist from 'minimist'
const execFile = promisify(_execFile)

async function main(args: minimist.ParsedArgs) {
  const {zoneFiles, outDir} = args
  try {
    execFile('/usr/sbin/zic', ['-d', outDir, ...zoneFiles.split(',')])
  } catch (e) {
    console.error(e)
    process.exitCode = 1
  }
}

if (import.meta.filename === process.argv[1]) {
  main(minimist(process.argv))
}
