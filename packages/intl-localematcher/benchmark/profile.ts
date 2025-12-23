import {findBestMatch} from '../abstract/utils.js'

// Profile locale matching to identify bottlenecks
// Run with: node --prof profile.ts
// Then analyze with: node --prof-process isolate-*.log

const manyLocales = Array.from({length: 700}, (_, i) => `locale-${i}`)
manyLocales.push('en', 'fr', 'zh', 'zh-Hant')

console.log('Starting profiling...')
console.log('Warming up...')

// Warm up
for (let i = 0; i < 1000; i++) {
  findBestMatch(['en'], manyLocales)
  findBestMatch(['en-US'], manyLocales)
  findBestMatch(['zh-TW'], ['zh-Hant', 'en'])
  findBestMatch(['en-XZ'], manyLocales)
}

console.log('Running profiled iterations...')

const iterations = 100000
const start = Date.now()

for (let i = 0; i < iterations; i++) {
  // Mix of all tiers to see where time is spent
  findBestMatch(['en'], manyLocales) // Tier 1
  findBestMatch(['en-US'], manyLocales) // Tier 2
  findBestMatch(['zh-TW'], ['zh-Hant', 'en']) // Tier 2 maximized
  findBestMatch(['en-XZ'], manyLocales) // Tier 3
}

const end = Date.now()
console.log(`Total time: ${((end - start) / 1000).toFixed(3)}s`)
console.log(`Completed ${iterations * 4} findBestMatch() calls`)
console.log(
  `Average: ${((end - start) / (iterations * 4)).toFixed(3)}ms per call`
)
