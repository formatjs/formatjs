import {getCanonicalLocales} from '#packages/intl-getcanonicallocales/index.js'
import {checkObservableConformance} from './observable-conformance.js'

let assertions = 0
const coverage = checkObservableConformance(
  Intl.getCanonicalLocales,
  getCanonicalLocales,
  (actual, expected, label) => {
    assertions++
    if (JSON.stringify(actual) !== JSON.stringify(expected))
      throw new Error(
        label +
          ': ' +
          JSON.stringify(actual) +
          ' != ' +
          JSON.stringify(expected)
      )
  }
)
console.log(
  JSON.stringify({
    type: 'reference-cases',
    candidate: 'native-node',
    reference: 'TypeScript source',
    assertions,
    ...coverage,
  })
)
