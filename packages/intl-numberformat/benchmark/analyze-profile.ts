import minimist from 'minimist'
import {existsSync, readdirSync, readFileSync} from 'fs'

interface CallFrame {
  functionName: string
  url: string
  lineNumber: number
}

interface ProfileNode {
  callFrame: CallFrame
  hitCount?: number
}

interface CPUProfile {
  nodes: ProfileNode[]
}

interface FunctionStats {
  hitCount: number
  url: string
}

interface FunctionEntry {
  name: string
  hitCount: number
  url: string
}

interface FileEntry {
  name: string
  hitCount: number
}

function analyzeProfile(profilePath: string): void {
  // Read and parse the profile file
  const profileData = readFileSync(profilePath, 'utf8')
  const profile: CPUProfile = JSON.parse(profileData)

  console.log(`Analyzing profile: ${profilePath}\n`)

  // Aggregate time by function name
  const timeByFunction = new Map<string, FunctionStats>()

  profile.nodes.forEach(node => {
    const funcName = node.callFrame.functionName || '(anonymous)'
    const url = node.callFrame.url
    const fileName = url.split('/').pop() || ''
    const key = `${funcName} [${fileName}:${node.callFrame.lineNumber}]`

    if (!timeByFunction.has(key)) {
      timeByFunction.set(key, {hitCount: 0, url})
    }

    const data = timeByFunction.get(key)!
    data.hitCount += node.hitCount || 0
  })

  // Sort by hit count
  const sorted: FunctionEntry[] = Array.from(timeByFunction.entries())
    .map(([name, data]) => ({name, ...data}))
    .filter(item => item.hitCount > 0 && !item.url.includes('node:internal'))
    .sort((a, b) => b.hitCount - a.hitCount)
    .slice(0, 40)

  console.log('Top 40 functions by CPU time (hit count):')
  console.log('==========================================\n')
  sorted.forEach((item, i) => {
    console.log(`${i + 1}. ${item.name}`)
    console.log(`   Hit count: ${item.hitCount}`)
    console.log(`   File: ${item.url}`)
    console.log('')
  })

  // Also group by file
  const timeByFile = new Map<string, number>()
  profile.nodes.forEach(node => {
    const url = node.callFrame.url
    if (url.includes('node:internal') || !url.includes('formatjs')) return

    const fileName = url.split('/packages/').pop()
    if (!fileName) return

    if (!timeByFile.has(fileName)) {
      timeByFile.set(fileName, 0)
    }

    timeByFile.set(fileName, timeByFile.get(fileName)! + (node.hitCount || 0))
  })

  const sortedByFile: FileEntry[] = Array.from(timeByFile.entries())
    .map(([name, hitCount]) => ({name, hitCount}))
    .sort((a, b) => b.hitCount - a.hitCount)
    .slice(0, 20)

  console.log('\n\nTop 20 files by CPU time:')
  console.log('=========================\n')
  sortedByFile.forEach((item, i) => {
    console.log(`${i + 1}. ${item.name}: ${item.hitCount} hits`)
  })
}

function main(): void {
  const argv = minimist(process.argv.slice(2), {
    string: ['profile', 'p'],
    alias: {p: 'profile'},
    default: {
      profile: '/tmp/CPU.*.cpuprofile',
    },
  })

  const profilePath = argv.profile || argv._[0]

  if (!profilePath) {
    console.error('Error: No profile path specified')
    console.error('\nUsage:')
    console.error('  analyze-profile <path-to-profile.cpuprofile>')
    console.error('  analyze-profile --profile <path-to-profile.cpuprofile>')
    console.error('  analyze-profile -p <path-to-profile.cpuprofile>')
    process.exit(1)
  }

  // Handle glob pattern for /tmp/CPU.*.cpuprofile
  if (profilePath.includes('*')) {
    const dir = profilePath.substring(0, profilePath.lastIndexOf('/'))
    const pattern = profilePath.substring(profilePath.lastIndexOf('/') + 1)
    const files = readdirSync(dir)
      .filter(f => f.match(pattern.replace('*', '.*')))
      .sort()
      .reverse() // Get most recent first

    if (files.length === 0) {
      console.error(`Error: No profile files found matching ${profilePath}`)
      process.exit(1)
    }

    const latestProfile = `${dir}/${files[0]}`
    console.log(`Using most recent profile: ${latestProfile}\n`)
    analyzeProfile(latestProfile)
    return
  }

  if (!existsSync(profilePath)) {
    console.error(`Error: Profile file not found: ${profilePath}`)
    process.exit(1)
  }

  analyzeProfile(profilePath)
}

main()
