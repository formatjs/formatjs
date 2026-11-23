import {createHash} from 'node:crypto'
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import minimist from 'minimist'
interface Args extends minimist.ParsedArgs {
  sourceDir: string
  manifest: string
  out: string
  fetch?: boolean
  updateHashes?: boolean
}
async function main(args: Args) {
  if (!args.sourceDir || !args.manifest || !args.out)
    throw new Error('--sourceDir, --manifest and --out required')
  if (args.fetch && args.updateHashes)
    throw new Error('Fetch requires pinned hashes')
  const expected = new Map<number, string>()
  if (!args.updateHashes)
    for (const line of readFileSync(args.manifest, 'utf8').trim().split('\n')) {
      if (line.startsWith('#')) continue
      const [year, hash] = line.split('\t')
      expected.set(+year, hash)
    }
  mkdirSync(args.sourceDir, {recursive: true})
  const hashes = [
      '# HKO annual English calendar text: https://www.hko.gov.hk/en/gts/time/calendar/text/files/T{year}e.txt',
    ],
    rows = [
      '# Published HKO month starts; Gregorian years 1901..2100. Columns: epoch day, related year, monthCode.',
    ]
  let previous = 0,
    count = 0,
    previousEpoch: number | undefined
  for (let year = 1901; year <= 2100; year++) {
    const file = join(args.sourceDir, `T${year}e.txt`)
    if (args.fetch) {
      const response = await fetch(
        `https://www.hko.gov.hk/en/gts/time/calendar/text/files/T${year}e.txt`
      )
      if (!response.ok) throw new Error(`${year}: HTTP ${response.status}`)
      writeFileSync(file, new Uint8Array(await response.arrayBuffer()))
    }
    const bytes = readFileSync(file),
      hash = createHash('sha256').update(bytes).digest('hex')
    if (!args.updateHashes && expected.get(year) !== hash)
      throw new Error(`HKO ${year} digest mismatch`)
    hashes.push(`${year}\t${hash}`)
    let months = 0
    // Date rows and month labels are ASCII even in older Big5 files.
    for (const line of bytes.toString('latin1').split('\n')) {
      const match =
        /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d+)(?:st|nd|rd|th) Lunar month\b/i.exec(
          line
        )
      if (!match) continue
      if (+match[1] !== year) throw new Error(`Unexpected year in ${file}`)
      const month = +match[4],
        related = +match[2] <= 2 && month >= 11 ? year - 1 : year
      if (month !== previous && month !== (previous % 12) + 1 && count !== 0)
        throw new Error(`Nonconsecutive HKO month: ${line}`)
      const epoch = Date.UTC(year, +match[2] - 1, +match[3]) / 86400000
      if (
        previousEpoch !== undefined &&
        ![29, 30].includes(epoch - previousEpoch)
      )
        throw new Error(`Invalid HKO month span: ${line}`)
      previousEpoch = epoch
      rows.push(
        `${epoch}\t${related}\tM${String(month).padStart(2, '0')}${month === previous ? 'L' : ''}`
      )
      previous = month
      count++
      months++
    }
    if (months < 12 || months > 13)
      throw new Error(`Incomplete HKO year ${year}: ${months} months`)
  }
  if (args.updateHashes) writeFileSync(args.manifest, hashes.join('\n') + '\n')
  writeFileSync(args.out, rows.join('\n') + '\n')
  process.stdout.write(
    `HKO: ${count} month starts from 200 pinned annual files\n`
  )
}
if (import.meta.filename === process.argv[1])
  main(minimist(process.argv.slice(2)) as Args)
