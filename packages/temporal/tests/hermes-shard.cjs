const {createHash} = require('node:crypto')
const {readFileSync, writeFileSync} = require('node:fs')

function createShard(index, count, expected) {
  if (
    !Number.isInteger(count) ||
    count < 1 ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= count
  )
    throw new Error('Invalid Test262 shard')
  const belongs = key =>
    createHash('sha256').update(key).digest().readUInt32BE(0) % count === index
  const seen = new Set()
  let selected = 0
  return {
    filter(test) {
      const file = test.file.replaceAll('\\', '/').split('/test/').pop()
      if (typeof test.scenario !== 'string')
        throw new Error('Missing Test262 scenario')
      const key = `${file} (${test.scenario})`
      if (seen.has(key)) throw new Error(`Duplicate Test262 discovery: ${key}`)
      seen.add(key)
      if (!belongs(key)) return false
      selected++
      return true
    },
    finish() {
      if (seen.size !== expected.total)
        throw new Error(
          `Test262 discovery count changed: ${seen.size} != ${expected.total}`
        )
      if (!selected) throw new Error('Empty Test262 shard')
      return {
        ...expected,
        total: selected,
        failures: Object.fromEntries(
          Object.entries(expected.failures).filter(([key]) => belongs(key))
        ),
      }
    },
  }
}

module.exports = {createShard}
if (process.env.FORMATJS_TEMPORAL_SHARD_BASELINE) {
  const shard = createShard(
    Number(process.env.TEST_SHARD_INDEX),
    Number(process.env.TEST_TOTAL_SHARDS),
    JSON.parse(
      readFileSync(process.env.FORMATJS_TEMPORAL_SHARD_BASELINE, 'utf8')
    )
  )
  module.exports = test => shard.filter(test)
  process.on('exit', () => {
    try {
      writeFileSync(
        process.env.FORMATJS_TEMPORAL_SHARD_OUTPUT,
        JSON.stringify(shard.finish())
      )
    } catch (error) {
      console.error(error)
      process.exitCode = 2
    }
  })
}
