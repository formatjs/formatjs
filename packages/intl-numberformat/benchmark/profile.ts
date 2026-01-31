import {NumberFormat} from '@formatjs/intl-numberformat'
// @ts-ignore
import en from './en.json' with {type: 'json'}
// @ts-ignore
NumberFormat.__addLocaleData(en)

// Test values matching the benchmark
const testValues = [59, 0, 1, 2, 3, 42, 99, 100, 1000]

// Create formatter
const nf = new NumberFormat('en')

console.log('Starting profiling...')
console.log('Warming up...')

// Warm up
for (let i = 0; i < 1000; i++) {
  testValues.forEach(val => nf.format(val))
}

console.log('Running profiled iterations...')
console.time('Total time')

// Run many iterations to get meaningful profile data
const iterations = 100000
for (let i = 0; i < iterations; i++) {
  testValues.forEach(val => nf.format(val))
}

console.timeEnd('Total time')
console.log(`Completed ${iterations * testValues.length} format() calls`)
