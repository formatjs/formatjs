import {Collator} from '@formatjs/intl-collator'
import {Bench} from 'tinybench'

const cases: {
  name: string
  locale: string
  options?: Intl.CollatorOptions
  left: string
  right: string
}[] = [
  {name: 'Latin', locale: 'en', left: 'apple', right: 'banana'},
  {name: 'accent', locale: 'en', left: 'café', right: 'cafe'},
  {
    name: 'numeric',
    locale: 'en',
    options: {numeric: true},
    left: 'item 9',
    right: 'item 10',
  },
  {name: 'normalization', locale: 'en', left: 'café', right: 'cafe\u0301'},
  {name: 'Swedish tailoring', locale: 'sv', left: 'zebra', right: 'ångström'},
  {name: 'CJK', locale: 'zh', left: '中文', right: '汉字'},
]

async function main() {
  const bench = new Bench({time: 1000})
  for (const {name, locale, options, left, right} of cases) {
    const compare = new Collator(locale, options).compare
    const nativeCompare = new Intl.Collator(locale, options).compare
    // Batch comparisons to reduce timer and sample-storage overhead.
    bench.add(`compare ${name} x32 (polyfill)`, () => {
      for (let i = 0; i < 32; i++) compare(left, right)
    })
    bench.add(`compare ${name} x32 (native)`, () => {
      for (let i = 0; i < 32; i++) nativeCompare(left, right)
    })
  }
  await bench.run()
  console.table(bench.table())
}

await main()
