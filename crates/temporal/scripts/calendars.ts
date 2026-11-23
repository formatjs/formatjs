import {writeFileSync} from 'node:fs'
import minimist from 'minimist'
import {chinese} from '@formatjs_generated/icu.calendar/chinese.js'
import {dangi} from '@formatjs_generated/icu.calendar/dangi.js'
import {ummAlQura} from '@formatjs_generated/icu.calendar/umm-al-qura.js'

interface Args extends minimist.ParsedArgs {
  out: string
}
interface LunarData {
  firstYear: number
  endDay: number
  checkpoints: number[]
  monthCheckpoints: number[]
  dictionary: number[]
  years: string
}
function integer(value: number): string {
  if (!Number.isSafeInteger(value)) throw new Error('Invalid calendar integer')
  return String(value)
}
function numbers(values: readonly number[]): string {
  return `&[${values.map(integer).join(',')}]`
}
function lunar(name: string, data: LunarData): string {
  if (!/^[A-Za-z0-9_-]+$/.test(data.years))
    throw new Error('Invalid calendar year encoding')
  return `pub(super) static ${name}: LunisolarData<'static> = LunisolarData { first_year: ${integer(data.firstYear)}, end_day: ${integer(data.endDay)}, checkpoints: ${numbers(data.checkpoints)}, month_checkpoints: ${numbers(data.monthCheckpoints)}, dictionary: ${numbers(data.dictionary)}, years: ${JSON.stringify(data.years)} };`
}
function main(args: Args): void {
  if (!args.out) throw new Error('--out required')
  writeFileSync(
    args.out,
    `// @generated from pinned @formatjs_generated/icu.calendar; do not edit.\n${lunar('CHINESE', chinese)}\n${lunar('DANGI', dangi)}\npub(super) static UMM_AL_QURA: UmmAlQuraData<'static> = UmmAlQuraData { first_year: ${integer(ummAlQura.firstYear)}, start_days: ${numbers(ummAlQura.startDays)}, month_lengths: ${numbers(ummAlQura.monthLengths)} };\n`
  )
}
if (import.meta.filename === process.argv[1])
  main(minimist<Args>(process.argv.slice(2)))
