import {Bench} from 'tinybench'

//@ts-ignore
// const Segmenter = Intl.Segmenter
import {Segmenter} from '#packages/intl-segmenter/segmenter.js'

import type {Segments} from '#packages/intl-segmenter/segmenter.js'
const locale = 'en'
let inputString = `

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec orci magna, tristique quis sollicitudin ut, luctus eu lacus. Suspendisse ultrices quam vitae consequat placerat. Interdum et malesuada fames ac ante ipsum primis in faucibus. Morbi eros turpis, gravida nec nibh vitae, egestas vestibulum tellus. Pellentesque et purus elit. Ut lacinia id lorem sit amet ornare. Etiam sed interdum mauris. Nam at dignissim erat. In ac arcu sodales, interdum lorem in, egestas orci. Pellentesque ac nibh lacinia quam vehicula consectetur. Vestibulum sodales nulla non dui elementum blandit. Pellentesque et hendrerit diam. Sed pharetra sodales est.

Etiam viverra dignissim pharetra. Praesent gravida finibus tellus eu tempus. Praesent sed justo augue. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Vestibulum mollis nunc in massa aliquam cursus. Aenean sagittis dapibus nibh vel pellentesque. Maecenas augue turpis, placerat quis erat et, pellentesque dictum neque. Cras faucibus egestas arcu molestie bibendum. Integer dignissim tempor arcu, sit amet dictum dui tempor non. Cras maximus justo mauris, at iaculis magna elementum sit amet.

Etiam malesuada libero sem, sit amet consequat dolor blandit non. In ut venenatis ligula. Pellentesque mattis imperdiet turpis id efficitur. Nunc felis lorem, vulputate a porttitor laoreet, mattis ac quam. Etiam molestie mi ac erat tincidunt interdum. Vestibulum sed nulla sit amet justo auctor fermentum. Sed varius ipsum lectus, sit amet eleifend nisi mollis at. In ac libero quis purus blandit venenatis. Praesent hendrerit quam vel risus tempor vehicula id eu enim. `

//multiply the input string to increase the size
inputString = inputString.repeat(10)

console.log(
  `Locale: ${locale}\nInput string size: ${Math.round(
    Buffer.byteLength(inputString, 'utf8') / 1000
  )} KB`
)
const cachedSegmenters = {
  word: new Segmenter(locale, {granularity: 'word'}),
  grapheme: new Segmenter(locale, {granularity: 'grapheme'}),
  sentence: new Segmenter(locale, {granularity: 'sentence'}),
}

const collectSegments = (iterator: Segments) => {
  let r
  const collected = []
  let i = iterator[Symbol.iterator]()
  while (!(r = i.next()).done) {
    // ar.push(r.value);
    collected.push({segment: r.value?.segment})
  }
  return collected
}

async function run() {
  const bench = new Bench({time: 1000})

  bench
    .add(
      'segment_cached_grapheme_collect_all',
      () =>
        collectSegments(cachedSegmenters.grapheme.segment(inputString)).length
    )
    .add(
      'segment_cached_word_collect_all',
      () => collectSegments(cachedSegmenters.word.segment(inputString)).length
    )
    .add(
      'segment_cached_sentence_collect_all',
      () =>
        collectSegments(cachedSegmenters.sentence.segment(inputString)).length
    )
    //@ts-ignore
    .add('segment_cached_grapheme_containing', () => {
      return cachedSegmenters.grapheme
        .segment(inputString)
        .containing(Math.floor(Math.random() * inputString.length))
    })
    .add('segment_cached_word_containing', () =>
      cachedSegmenters.word
        .segment(inputString)
        .containing(Math.floor(Math.random() * inputString.length))
    )
    .add('segment_cached_sentence_containing', () =>
      cachedSegmenters.sentence
        .segment(inputString)
        .containing(Math.floor(Math.random() * inputString.length))
    )
    .add(
      'new_segmenter_grapheme',
      () => new Segmenter(locale, {granularity: 'grapheme'})
    )
    .add(
      'new_segmenter_word',
      () => new Segmenter(locale, {granularity: 'word'})
    )
    .add(
      'new_segmenter_sentence',
      () => new Segmenter(locale, {granularity: 'sentence'})
    )

  await bench.run()

  console.table(bench.table())
}

run()
