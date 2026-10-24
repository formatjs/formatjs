import assert from 'node:assert/strict'
import {readFileSync, readdirSync} from 'node:fs'
import path from 'node:path'
import {rolldown} from 'rolldown'

interface SourceMap {
  sources: string[]
  sourcesContent: string[]
  mappings: string
}

const packages = process.argv.slice(2)
assert.ok(packages.length > 0)
for (const directory of packages) {
  const maps = readdirSync(directory, {recursive: true})
    .map(String)
    .filter(file => file.endsWith('.js.map'))
  assert.ok(maps.length > 0, directory)
  for (const file of maps) {
    const map: SourceMap = JSON.parse(
      readFileSync(path.join(directory, file), 'utf8')
    )
    assert.ok(map.mappings.length > 0, file)
    assert.equal(map.sourcesContent.length, map.sources.length, file)
    for (const [index, source] of map.sources.entries()) {
      assert.ok(source.startsWith('sources/'), source)
      assert.ok(!source.split('/').includes('..'), source)
      assert.ok(!source.includes('\\'), source)
      assert.ok(!source.includes('.aspect_rules_js'), source)
      assert.equal(typeof map.sourcesContent[index], 'string', source)
    }
  }

  const bundle = await rolldown({
    input: path.resolve(directory, 'index.js'),
    external: id => !id.startsWith('.') && !path.isAbsolute(id),
    plugins: [
      {
        name: 'published-sourcemaps',
        load(id) {
          return {
            code: readFileSync(id, 'utf8'),
            map: readFileSync(`${id}.map`, 'utf8'),
          }
        },
      },
    ],
  })
  try {
    const result = await bundle.generate({
      format: 'es',
      sourcemap: true,
      file: 'out.js',
    })
    const chunk = result.output.find(output => output.type === 'chunk')
    assert.ok(chunk?.map)
    const chained = chunk.map
    assert.ok(chained.mappings.length > 0)
    assert.ok(chained.sources.length > 0)
    assert.ok(
      chained.sources.every(source => source.includes('/sources/')),
      JSON.stringify(chained.sources)
    )
    assert.ok(
      chained.sourcesContent.every(source => typeof source === 'string')
    )
  } finally {
    await bundle.close()
  }
}
