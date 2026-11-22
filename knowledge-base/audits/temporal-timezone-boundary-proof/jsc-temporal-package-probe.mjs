const [fixtures, entry, publicResults] = globalThis.arguments
const {Temporal} = await import(entry)
const {
  zones: {unsupported},
} = JSON.parse(globalThis.readFile(publicResults))
const skipped = new Set(unsupported)
const rows = JSON.parse(globalThis.readFile(fixtures))
const summary = {
  offsets: 0,
  folds: 0,
  gaps: 0,
  zones: 0,
  unsupported: [],
  failures: 0,
  mismatches: [],
}

function compare(actual, expected, details) {
  if (actual === expected) return
  summary.failures++
  if (summary.mismatches.length < 10)
    summary.mismatches.push({actual, expected, ...details})
}

for (const {id, expectedBoundaries, endpoints} of rows) {
  if (skipped.has(id)) continue
  try {
    new Temporal.ZonedDateTime(0n, id)
  } catch (error) {
    if (!(error instanceof RangeError)) throw error
    summary.unsupported.push(id)
    continue
  }
  summary.zones++
  for (const [milliseconds, expected] of endpoints) {
    const epoch = BigInt(milliseconds) * 1_000_000n
    const offset = new Temporal.ZonedDateTime(epoch, id).offsetNanoseconds
    summary.offsets++
    compare(offset, expected * 1_000_000, {id, milliseconds})
  }
  for (const [epoch, before, after] of expectedBoundaries) {
    if (before === after) continue
    const gap = before < after
    const local = epoch + (before + after) / 2
    const source = `${new Date(local).toISOString().slice(0, -1)}[${id}]`
    for (const [disambiguation, expected] of [
      ['earlier', local - Math.max(before, after)],
      ['later', local - Math.min(before, after)],
      ['compatible', local - (gap ? before : Math.max(before, after))],
      ['reject', 'RangeError'],
    ]) {
      let actual
      try {
        actual = Temporal.ZonedDateTime.from(source, {
          disambiguation,
        }).epochMilliseconds
      } catch (error) {
        if (!(error instanceof RangeError)) throw error
        actual = error.name
      }
      summary[gap ? 'gaps' : 'folds']++
      compare(actual, expected, {source, disambiguation})
    }
  }
}
globalThis.print(JSON.stringify(summary))
