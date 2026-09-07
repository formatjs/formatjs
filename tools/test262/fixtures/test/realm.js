/*---
description: generated harness fixture
---*/
if (globalThis.polyfillMarker !== 42) throw new Error('root missing')
const child = $262.createRealm()
if (child.global.polyfillMarker !== 42) throw new Error('child missing')
const grandchild = child.createRealm()
if (grandchild.global.polyfillMarker !== 42)
  throw new Error('grandchild missing')
