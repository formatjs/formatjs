import '#packages/temporal/polyfill-force.js'
import {nativeTemporal} from '#packages/temporal/native.js'

if (nativeTemporal())
  throw new Error('TypeScript conformance unexpectedly uses the Rust backend')
