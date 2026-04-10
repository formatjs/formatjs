import {Bench} from 'tinybench'
import en from '#packages/intl-datetimeformat/tests/locale-data/en.json' with {type: 'json'}
import allData from '#packages/intl-datetimeformat/src/data/all-tz.generated'
import {DateTimeFormat} from '#packages/intl-datetimeformat/src/core'
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
