import {Temporal} from '#packages/temporal/index.js'

// Replace the whole native namespace: unimplemented types must never pass tests.
Object.defineProperty(globalThis, 'Temporal', {
  value: Temporal,
  writable: true,
  configurable: true,
})
