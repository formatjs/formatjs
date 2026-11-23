import {needsTemporal} from '#packages/temporal/detect.js'

export function shouldPolyfill(): boolean {
  return (
    needsTemporal() || typeof Date.prototype.toTemporalInstant !== 'function'
  )
}
