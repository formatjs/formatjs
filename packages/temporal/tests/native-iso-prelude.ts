import {
  configureNativeTemporal,
  type NativeQuery,
} from '#packages/temporal/native.js'
import {installTemporal} from '#packages/temporal/install.js'

const host = globalThis as typeof globalThis & {
  __formatjsTemporalISOQuery?: NativeQuery
}
const query = host.__formatjsTemporalISOQuery
if (!query) throw new Error('Rust Temporal ISO bridge missing')
configureNativeTemporal(query)
delete host.__formatjsTemporalISOQuery
installTemporal(true)
