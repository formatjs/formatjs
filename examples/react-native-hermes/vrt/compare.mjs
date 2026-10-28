import {readFileSync, writeFileSync} from 'node:fs'
import pixelmatch from 'pixelmatch'
import {PNG} from 'pngjs'

const actualPath = process.argv[2]
if (!actualPath) {
  throw new Error('Usage: npm run vrt -- <captured screenshot>')
}

const baseline = PNG.sync.read(
  readFileSync(new URL('./intl-screen.png', import.meta.url))
)
const actual = PNG.sync.read(readFileSync(actualPath))
if (baseline.width !== actual.width || baseline.height !== actual.height) {
  throw new Error(
    `Screen size changed: expected ${baseline.width}x${baseline.height}, got ${actual.width}x${actual.height}`
  )
}

const diff = new PNG({width: baseline.width, height: baseline.height})
const changed = pixelmatch(
  baseline.data,
  actual.data,
  diff.data,
  baseline.width,
  baseline.height,
  {threshold: 0.1}
)
const diffPath = process.env.VRT_DIFF || '/tmp/formatjs-hermes-intl-diff.png'
writeFileSync(diffPath, PNG.sync.write(diff))
if (changed > 0) {
  throw new Error(`${changed} pixels differ; diff: ${diffPath}`)
}
console.log('Android Intl screenshot matches baseline')
