if (typeof Temporal !== 'object')
  throw new Error('Temporal SDK installer missing')
if (
  Object.prototype.hasOwnProperty.call(globalThis, '__formatjsTemporalISOQuery')
)
  throw new Error('Temporal SDK depends on runner-only bridge')
