import {
  configureNativeISO,
  type NativeISOQuery,
} from '#packages/temporal/native-iso.js'
import {installTemporal} from '#packages/temporal/install.js'

const host = globalThis as typeof globalThis & {
  __formatjsTemporalISOQuery?: NativeISOQuery
}
const query = host.__formatjsTemporalISOQuery
if (!query) throw new Error('Rust Temporal ISO bridge missing')
configureNativeISO(query)
delete host.__formatjsTemporalISOQuery
installTemporal(true)
