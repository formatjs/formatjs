/*---
description: generated harness fixture
---*/
if (globalThis.polyfillMarker !== 42) throw new Error('root missing')
const hostProcess = require('node:process')
const originalDirectory = hostProcess.cwd()
hostProcess.chdir(require('node:os').tmpdir())
try {
  globalThis.polyfillMarker = 99
  const child = $262.createRealm()
  if (child.global.polyfillMarker !== 42) throw new Error('child missing')
  child.global.polyfillMarker = 17
  const grandchild = child.createRealm()
  if (grandchild.global.polyfillMarker !== 42)
    throw new Error('grandchild missing')

  for (const global of [globalThis, child.global, grandchild.global]) {
    if (global.combinedMarker !== 43)
      throw new Error('prelude order or installation failed')
    if (typeof global.Temporal?.PlainDate !== 'function')
      throw new Error('Temporal missing from test realm')
    if (global.Temporal.PlainDate.from('2026-01-02').day !== 2)
      throw new Error('Temporal failed in test realm')
  }
} finally {
  hostProcess.chdir(originalDirectory)
}
