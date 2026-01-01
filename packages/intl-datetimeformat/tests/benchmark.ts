import {Bench} from 'tinybench'
import * as en from './locale-data/en.json' with {type: 'json'}
import allData from '../src/data/all-tz.generated'
import {DateTimeFormat} from '../src/core'
DateTimeFormat.__addTZData(allData)
// @ts-ignore
DateTimeFormat.__addLocaleData(en)

const dt = new Date()
const dtf = new DateTimeFormat('en')
const nativeDtf = new Intl.DateTimeFormat('en')

async function run() {
  const bench = new Bench({time: 1000})

  bench
    .add('format (polyfill)', () => dtf.format(dt))
    .add('format (native)', () => nativeDtf.format(dt))

  await bench.run()

  console.table(bench.table())
}

run()
