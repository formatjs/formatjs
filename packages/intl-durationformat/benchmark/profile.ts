import {DurationFormat} from '@formatjs/intl-durationformat'

// Test durations matching the benchmark
const testDurations = [
  {hours: 1, minutes: 30},
  {minutes: 45, seconds: 30},
  {seconds: 59},
  {hours: 2, minutes: 15, seconds: 42},
  {minutes: 3, seconds: 45},
  {hours: 1, minutes: 0, seconds: 0},
  {days: 5, hours: 12, minutes: 30, seconds: 45},
  {hours: 23, minutes: 59, seconds: 59},
  {seconds: 5, milliseconds: 250},
  {milliseconds: 500},
  {years: 1, months: 6, weeks: 2, days: 3},
  {months: 11, days: 29, hours: 23},
]

// Create formatters
const dfShort = new DurationFormat('en', {style: 'short'})
const dfDigital = new DurationFormat('en', {style: 'digital'})

console.log('Starting profiling...')
console.log('Warming up...')

// Warm up
for (let i = 0; i < 1000; i++) {
  testDurations.forEach(val => dfShort.format(val))
}

console.log('Running profiled iterations...')
console.time('Total time')

// Run many iterations to get meaningful profile data
const iterations = 100000
for (let i = 0; i < iterations; i++) {
  testDurations.forEach(val => dfShort.format(val))
}

// Also profile digital format (common for video durations)
for (let i = 0; i < iterations / 2; i++) {
  testDurations.forEach(val => dfDigital.format(val))
}

console.timeEnd('Total time')
console.log(
  `Completed ${iterations * testDurations.length * 1.5} format() calls`
)
