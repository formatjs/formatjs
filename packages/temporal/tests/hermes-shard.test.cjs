const assert = require('node:assert/strict')
const {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} = require('node:fs')
const {tmpdir} = require('node:os')
const {join, resolve} = require('node:path')
const {spawnSync} = require('node:child_process')
const {test} = require('node:test')
const {createShard} = require('./hermes-shard.cjs')

test('partitions every scenario once and keeps tracked failures on their shard', () => {
  const cases = Array.from({length: 128}, (_, i) => ({
    file: `/suite/test/example/${i}.js`,
    scenario: i % 2 ? 'strict mode' : 'default',
  }))
  const key = 'example/0.js (default)'
  const expected = {total: cases.length, failures: {[key]: 'known failure'}}
  const all = []
  let failures = 0
  for (let index = 0; index < 8; index++) {
    const shard = createShard(index, 8, expected)
    const selected = cases.filter(testCase => shard.filter(testCase))
    const baseline = shard.finish()
    assert.equal(baseline.total, selected.length)
    failures += Object.keys(baseline.failures).length
    all.push(...selected)
  }
  assert.equal(new Set(all).size, cases.length)
  assert.equal(all.length, cases.length)
  assert.equal(failures, 1)
  assert.throws(() => createShard(8, 8, expected), /Invalid/)
  const missing = createShard(0, 1, expected)
  missing.filter(cases[0])
  assert.throws(() => missing.finish(), /discovery count changed/)
  assert.throws(() => missing.filter(cases[0]), /Duplicate/)
})

test('upstream harness shards retain the complete report', () => {
  const dir = mkdtempSync(join(tmpdir(), 'temporal-shard-'))
  try {
    mkdirSync(join(dir, 'test'))
    mkdirSync(join(dir, 'harness'))
    writeFileSync(join(dir, 'package.json'), JSON.stringify({version: '1.0.0'}))
    for (let i = 0; i < 32; i++)
      writeFileSync(
        join(dir, 'test', `${i}.js`),
        '/*---\nflags: [raw]\n---*/\nif (1 + 1 !== 2) throw new Error("assertion");\n'
      )
    const baseline = join(dir, 'baseline.json')
    writeFileSync(baseline, JSON.stringify({total: 32, failures: {}}))
    const all = []
    for (let index = 0; index < 4; index++) {
      const output = join(dir, `shard-${index}.json`)
      const result = spawnSync(
        resolve(process.argv[2]),
        [
          '--host-type=node',
          `--host-path=${process.execPath}`,
          '--threads=1',
          '--reporter=json',
          '--reporter-keys=file,scenario,result',
          '--errorForFailures',
          `--test262Dir=${dir}`,
          `--preprocessor=${join(__dirname, 'hermes-shard.cjs')}`,
          join(dir, 'test', '*.js'),
        ],
        {
          encoding: 'utf8',
          env: {
            ...process.env,
            TEST_SHARD_INDEX: String(index),
            TEST_TOTAL_SHARDS: '4',
            FORMATJS_TEMPORAL_SHARD_BASELINE: baseline,
            FORMATJS_TEMPORAL_SHARD_OUTPUT: output,
          },
        }
      )
      assert.equal(result.status, 0, result.stderr)
      const report = JSON.parse(result.stdout)
      assert.equal(
        report.length,
        JSON.parse(readFileSync(output, 'utf8')).total
      )
      assert.ok(report.every(row => row.result.pass))
      all.push(...report.map(row => row.file))
    }
    assert.equal(all.length, 32)
    assert.equal(new Set(all).size, 32)
  } finally {
    rmSync(dir, {recursive: true, force: true})
  }
})
