import {Bench} from 'tinybench'
import {DurationFormat} from '@formatjs/intl-durationformat'

// Test cases covering different duration patterns and use cases
const testDurations = [
  // Simple cases
  {hours: 1, minutes: 30},
  {minutes: 45, seconds: 30},
  {seconds: 59},

  // Video/media durations (common use case)
  {hours: 2, minutes: 15, seconds: 42},
  {minutes: 3, seconds: 45},
  {hours: 1, minutes: 0, seconds: 0},

  // Complex durations with multiple units
  {days: 5, hours: 12, minutes: 30, seconds: 45},
  {hours: 23, minutes: 59, seconds: 59},

  // Sub-second precision
  {seconds: 5, milliseconds: 250},
  {milliseconds: 500},

  // Long durations
  {years: 1, months: 6, weeks: 2, days: 3},
  {months: 11, days: 29, hours: 23},
]

// Create formatters with different styles
const dfShort = new DurationFormat('en', {style: 'short'})
const dfLong = new DurationFormat('en', {style: 'long'})
const dfNarrow = new DurationFormat('en', {style: 'narrow'})
const dfDigital = new DurationFormat('en', {style: 'digital'})

// Native formatters for comparison (if available)
const nativeDfShort =
  typeof Intl.DurationFormat !== 'undefined'
    ? new Intl.DurationFormat('en', {style: 'short'})
    : null
const nativeDfLong =
  typeof Intl.DurationFormat !== 'undefined'
    ? new Intl.DurationFormat('en', {style: 'long'})
    : null
const nativeDfDigital =
  typeof Intl.DurationFormat !== 'undefined'
    ? new Intl.DurationFormat('en', {style: 'digital'})
    : null

async function run() {
  const bench = new Bench({time: 1000})

  bench
    // Short style formatting (most common)
    .add('format short style (polyfill)', () => {
      testDurations.forEach(val => dfShort.format(val))
    })

  if (nativeDfShort) {
    bench.add('format short style (native)', () => {
      testDurations.forEach(val => nativeDfShort.format(val))
    })
  }

  bench
    // Long style formatting
    .add('format long style (polyfill)', () => {
      testDurations.forEach(val => dfLong.format(val))
    })

  if (nativeDfLong) {
    bench.add('format long style (native)', () => {
      testDurations.forEach(val => nativeDfLong.format(val))
    })
  }

  bench
    // Narrow style formatting
    .add('format narrow style (polyfill)', () => {
      testDurations.forEach(val => dfNarrow.format(val))
    })

    // Digital style formatting (like 1:30:45)
    .add('format digital style (polyfill)', () => {
      testDurations.forEach(val => dfDigital.format(val))
    })

  if (nativeDfDigital) {
    bench.add('format digital style (native)', () => {
      testDurations.forEach(val => nativeDfDigital.format(val))
    })
  }

  bench
    // formatToParts (heavier operation)
    .add('formatToParts short style (polyfill)', () => {
      testDurations.forEach(val => dfShort.formatToParts(val))
    })

  if (nativeDfShort) {
    bench.add('formatToParts short style (native)', () => {
      testDurations.forEach(val => nativeDfShort.formatToParts(val))
    })
  }

  bench
    // Video/media duration formatting (common real-world use case)
    .add('format video durations (polyfill)', () => {
      const videoDurations = [
        {hours: 2, minutes: 15, seconds: 42},
        {minutes: 3, seconds: 45},
        {hours: 1, minutes: 0, seconds: 0},
        {minutes: 45, seconds: 30},
        {seconds: 59},
      ]
      videoDurations.forEach(val => dfDigital.format(val))
    })

  if (nativeDfDigital) {
    bench.add('format video durations (native)', () => {
      const videoDurations = [
        {hours: 2, minutes: 15, seconds: 42},
        {minutes: 3, seconds: 45},
        {hours: 1, minutes: 0, seconds: 0},
        {minutes: 45, seconds: 30},
        {seconds: 59},
      ]
      videoDurations.forEach(val => nativeDfDigital.format(val))
    })
  }

  bench
    // Sub-second precision (milliseconds)
    .add('format with milliseconds (polyfill)', () => {
      const msDelays = [
        {seconds: 5, milliseconds: 250},
        {milliseconds: 500},
        {seconds: 0, milliseconds: 100},
      ]
      msDelays.forEach(val => dfShort.format(val))
    })

  await bench.run()

  console.table(bench.table())
}

run()
