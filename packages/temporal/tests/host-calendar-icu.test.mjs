import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'
import {Temporal as Reference} from 'temporal-polyfill/full/implementation'

const {Temporal} = await import(
  pathToFileURL(runfiles.resolve(process.argv[2]))
)
const {checkPublicCalendarOracle} = await import(
  pathToFileURL(runfiles.resolve(process.argv[3]))
)
const fixture = readFileSync(runfiles.resolve(process.argv[4]), 'utf8')
function check(namespace) {
  const counts = {
    fields: 0,
    additions: 0,
    bounds: 0,
    bridges: 0,
    differences: 0,
    windows: 0,
  }
  const failures = new Map()
  for (const line of fixture.trim().split('\n')) {
    if (line.startsWith('#')) continue
    try {
      checkPublicCalendarOracle(
        namespace,
        line,
        (actual, expected, context) => {
          assert.equal(actual, expected, context)
        },
        counts
      )
    } catch (error) {
      failures.set(line, String(error))
    }
  }
  return {counts, failures}
}
const owned = check(Temporal)
const report = result => ({
  counts: result.counts,
  failures: result.failures.size,
  samples: [...result.failures].slice(0, 20),
})
console.log(JSON.stringify({owned: report(owned)}, null, 2))
if (process.env.FORMATJS_TEMPORAL_HOST_CALENDAR_REFERENCE === '1') {
  const reference = check(Reference)
  console.log(JSON.stringify({reference: report(reference)}, null, 2))
  assert.deepEqual(
    [...owned.failures],
    [...reference.failures],
    'Host calendar must match reference on the same ICU corpus and Intl runtime'
  )
  assert.deepEqual(owned.counts, reference.counts)
} else {
  assert.equal(
    owned.failures.size,
    0,
    'Host calendar ICU mismatches remain implementation or host-data gaps'
  )
  assert.deepEqual(owned.counts, {
    fields: 15932,
    additions: 6720,
    bounds: 0,
    bridges: 937,
    differences: 6720,
    windows: 1248,
  })
}
