import benchmark from 'benchmark'
import * as en from './locale-data/en.json'
import allData from '../src/data/all-tz'
import {DateTimeFormat} from '../src/core'
DateTimeFormat.__addTZData(allData)
// @ts-ignore
DateTimeFormat.__addLocaleData(en)

const dt = new Date()
const dtf = new DateTimeFormat('en')
const nativeDtf = new Intl.DateTimeFormat('en')
new benchmark.Suite()
  .add('format (polyfill)', () => dtf.format(dt))
  .add('format (native)', () => nativeDtf.format(dt))
  .on('cycle', function (event: any) {
    console.log(String(event.target))
  })
  .run()
