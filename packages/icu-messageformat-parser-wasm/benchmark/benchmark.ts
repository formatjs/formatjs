import {Bench} from 'tinybench'
import {parse as wasmParse} from '@formatjs/icu-messageformat-parser-wasm'
import {parse as jsParse} from '@formatjs/icu-messageformat-parser'

const complexMsg =
  '' +
  '{gender_of_host, select, ' +
  'female {' +
  '{num_guests, plural, offset:1 ' +
  '=0 {{host} does not give a party.}' +
  '=1 {{host} invites <em>{guest}</em> to her party.}' +
  '=2 {{host} invites <em>{guest}</em> and <em>one</em> other person to her party.}' +
  'other {{host} invites <em>{guest}</em> and <em>#</em> other people to her party.}}}' +
  'male {' +
  '{num_guests, plural, offset:1 ' +
  '=0 {{host} does not give a party.}' +
  '=1 {{host} invites <em>{guest}</em> to his party.}' +
  '=2 {{host} invites <em>{guest}</em> and one other person to his party.}' +
  'other {{host} invites <em>{guest}</em> and <em>#</em> other people to his party.}}}' +
  'other {' +
  '{num_guests, plural, offset:1 ' +
  '=0 {{host} does not give a party.}' +
  '=1 {{host} invites <em>{guest}</em> to their party.}' +
  '=2 {{host} invites <em>{guest}</em> and one other person to their party.}' +
  'other {{host} invites <em>{guest}</em> and <em>#</em> other people to their party.}}}}'

const normalMsg =
  '' +
  'Yo, {firstName} {lastName} has ' +
  '{numBooks, number, integer} ' +
  '{numBooks, plural, ' +
  'one {book} ' +
  'other {books}}.'

const simpleMsg = 'Hello, {name}!'

const stringMsg = 'Hello, world!'

async function run() {
  // Warm up the WASM module
  await wasmParse(stringMsg)

  // Use consistent options for fair comparison (no location tracking)
  const options = {captureLocation: false}

  console.log('JS Parser (no location):')
  console.log(
    '  complex_msg AST length',
    JSON.stringify(jsParse(complexMsg, options)).length
  )
  console.log(
    '  normal_msg AST length',
    JSON.stringify(jsParse(normalMsg, options)).length
  )
  console.log(
    '  simple_msg AST length',
    JSON.stringify(jsParse(simpleMsg, options)).length
  )
  console.log(
    '  string_msg AST length',
    JSON.stringify(jsParse(stringMsg, options)).length
  )

  console.log('\nWASM Parser (no location):')
  console.log(
    '  complex_msg AST length',
    JSON.stringify(await wasmParse(complexMsg, options)).length
  )
  console.log(
    '  normal_msg AST length',
    JSON.stringify(await wasmParse(normalMsg, options)).length
  )
  console.log(
    '  simple_msg AST length',
    JSON.stringify(await wasmParse(simpleMsg, options)).length
  )
  console.log(
    '  string_msg AST length',
    JSON.stringify(await wasmParse(stringMsg, options)).length
  )

  const bench = new Bench({time: 1000})

  bench
    .add('JS: complex_msg', () => jsParse(complexMsg, options))
    .add('WASM: complex_msg', async () => await wasmParse(complexMsg, options))
    .add('JS: normal_msg', () => jsParse(normalMsg, options))
    .add('WASM: normal_msg', async () => await wasmParse(normalMsg, options))
    .add('JS: simple_msg', () => jsParse(simpleMsg, options))
    .add('WASM: simple_msg', async () => await wasmParse(simpleMsg, options))
    .add('JS: string_msg', () => jsParse(stringMsg, options))
    .add('WASM: string_msg', async () => await wasmParse(stringMsg, options))

  await bench.run()

  console.log('\nBenchmark Results:')
  const table = bench.table()
  console.table(table)

  // Calculate relative performance
  console.log('\nRelative Performance (WASM vs JS):')
  for (let i = 0; i < table.length; i += 2) {
    const jsRow = table[i]
    const wasmRow = table[i + 1]

    if (jsRow && wasmRow) {
      // Parse ops/s from the 'Throughput avg (ops/s)' column
      const jsOpsStr = jsRow['Throughput avg (ops/s)'] as string
      const wasmOpsStr = wasmRow['Throughput avg (ops/s)'] as string

      const jsOps = parseFloat(jsOpsStr.replace(/[^0-9.]/g, ''))
      const wasmOps = parseFloat(wasmOpsStr.replace(/[^0-9.]/g, ''))

      if (!isNaN(jsOps) && !isNaN(wasmOps) && jsOps > 0 && wasmOps > 0) {
        const ratio = wasmOps / jsOps
        const msgType = (jsRow['Task name'] as string).replace('JS: ', '')
        if (ratio >= 1) {
          console.log(`  ${msgType}: WASM is ${ratio.toFixed(2)}x faster`)
        } else {
          console.log(`  ${msgType}: WASM is ${(1 / ratio).toFixed(2)}x slower`)
        }
      }
    }
  }

  console.log(
    '\nNote: WASM parser includes async overhead from initialization and Promise resolution.'
  )
  console.log(
    'For server-side or batch processing where the module stays loaded, WASM may be faster.'
  )
}

run()
