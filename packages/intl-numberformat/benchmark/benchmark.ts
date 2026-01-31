import {Bench} from 'tinybench'
import {NumberFormat} from '@formatjs/intl-numberformat'
// @ts-ignore
import en from './en.json' with {type: 'json'}
// @ts-ignore
NumberFormat.__addLocaleData(en)

// Test cases that match the issue description - repeated formatting with similar values
const testValues = [59, 0, 1, 2, 3, 42, 99, 100, 1000]
const dateValues = Array.from({length: 60}, (_, i) => i) // 0-59 for minutes/seconds

const nf = new NumberFormat('en')
const nfPercent = new NumberFormat('en', {style: 'percent'})
const nfCurrency = new NumberFormat('en', {style: 'currency', currency: 'USD'})
const nfUnit = new NumberFormat('en', {
  style: 'unit',
  unit: 'hour',
  unitDisplay: 'long',
})
const nfSignificantDigits = new NumberFormat('en', {
  minimumSignificantDigits: 2,
  maximumSignificantDigits: 4,
})
const nfFractionDigits = new NumberFormat('en', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

// Native formatters for comparison
const nativeNf = new Intl.NumberFormat('en')
const nativeNfPercent = new Intl.NumberFormat('en', {style: 'percent'})
const nativeNfCurrency = new Intl.NumberFormat('en', {
  style: 'currency',
  currency: 'USD',
})

async function run() {
  const bench = new Bench({time: 1000})

  bench
    // Basic decimal formatting (most common case)
    .add('format decimal (polyfill)', () => {
      testValues.forEach(val => nf.format(val))
    })
    .add('format decimal (native)', () => {
      testValues.forEach(val => nativeNf.format(val))
    })

    // Percent formatting
    .add('format percent (polyfill)', () => {
      testValues.forEach(val => nfPercent.format(val))
    })
    .add('format percent (native)', () => {
      testValues.forEach(val => nativeNfPercent.format(val))
    })

    // Currency formatting
    .add('format currency (polyfill)', () => {
      testValues.forEach(val => nfCurrency.format(val))
    })
    .add('format currency (native)', () => {
      testValues.forEach(val => nativeNfCurrency.format(val))
    })

    // Unit formatting
    .add('format unit (polyfill)', () => {
      testValues.forEach(val => nfUnit.format(val))
    })

    // Significant digits (uses ToRawPrecision - performance hotspot)
    .add('format with significantDigits (polyfill)', () => {
      testValues.forEach(val => nfSignificantDigits.format(val))
    })

    // Fraction digits (uses ToRawFixed)
    .add('format with fractionDigits (polyfill)', () => {
      testValues.forEach(val => nfFractionDigits.format(val))
    })

    // Real-world scenario: formatting time values (0-59) - matches issue description
    .add('format time values 0-59 (polyfill)', () => {
      dateValues.forEach(val => nf.format(val))
    })
    .add('format time values 0-59 (native)', () => {
      dateValues.forEach(val => nativeNf.format(val))
    })

    // formatToParts (heavier operation)
    .add('formatToParts decimal (polyfill)', () => {
      testValues.forEach(val => nf.formatToParts(val))
    })
    .add('formatToParts decimal (native)', () => {
      testValues.forEach(val => nativeNf.formatToParts(val))
    })

  await bench.run()

  console.table(bench.table())
}

run()
