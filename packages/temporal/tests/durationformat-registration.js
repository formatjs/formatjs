if (typeof Temporal !== 'object') throw new Error('Temporal missing')
const formatter = new Intl.DurationFormat('en', {style: 'digital'})
const value = Temporal.Duration.from('PT1H2M3S')
const prototype = Temporal.Duration.prototype
const descriptors = Object.getOwnPropertyDescriptors(prototype)
const from = Object.getOwnPropertyDescriptor(Temporal.Duration, 'from')
try {
  Object.defineProperty(Temporal.Duration, 'from', {
    get() {
      throw new Error('public parser')
    },
  })
  for (const field of [
    'years',
    'months',
    'weeks',
    'days',
    'hours',
    'minutes',
    'seconds',
    'milliseconds',
    'microseconds',
    'nanoseconds',
  ])
    Object.defineProperty(prototype, field, {
      get() {
        throw new Error('public getter')
      },
    })
  Intl.DurationFormat.__addTemporalNamespace(Temporal)
  if (
    formatter.format(value) !== '1:02:03' ||
    formatter.format('PT1H2M3S') !== '1:02:03' ||
    formatter
      .formatToParts(value)
      .map(part => part.value)
      .join('') !== '1:02:03'
  )
    throw new Error('Captured duration conversion changed')
} finally {
  Object.defineProperties(prototype, descriptors)
  Object.defineProperty(Temporal.Duration, 'from', from)
}
print('Duration registration retains captured intrinsics')
