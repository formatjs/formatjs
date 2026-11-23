// ECMA-262 §21.4.1.33 grammar and §21.4.1.33.2 steps 1–17:
// https://tc39.es/ecma262/#sec-time-zone-offset-strings
// Every code-unit read is bounded; private parsing observes no prototype hooks.
export function UTCOffsetNanoseconds(
  value: string,
  minuteOnly = false
): number | undefined {
  const length = value.length
  if (length < 3 || length > (minuteOnly ? 6 : 19)) return undefined
  const sign = value[0]
  if (sign !== '+' && sign !== '-') return undefined
  const pair = (index: number, maximum: number): number => {
    if (index + 1 >= length) return -1
    const first = value[index],
      second = value[index + 1]
    if (first < '0' || first > '9' || second < '0' || second > '9') return -1
    const result = +first * 10 + +second
    return result <= maximum ? result : -1
  }
  const hour = pair(1, 23)
  if (hour < 0) return undefined
  let index = 3,
    minute = 0,
    second = 0,
    fraction = 0
  if (index < length) {
    const extended = value[index] === ':'
    if (extended) index++
    minute = pair(index, 59)
    if (minute < 0) return undefined
    index += 2
    if (index < length) {
      if (minuteOnly) return undefined
      if (extended && value[index++] !== ':') return undefined
      second = pair(index, 59)
      if (second < 0) return undefined
      index += 2
      if (index < length) {
        const separator = value[index++]
        if (separator !== '.' && separator !== ',') return undefined
        let digits = 0
        while (index < length) {
          const digit = value[index++]
          if (digits === 9 || digit < '0' || digit > '9') return undefined
          fraction = fraction * 10 + +digit
          digits++
        }
        if (digits === 0) return undefined
        while (digits++ < 9) fraction *= 10
      }
    }
  }
  // All intermediates are integers below 86400000000000, hence exact Numbers.
  const result = ((hour * 60 + minute) * 60 + second) * 1_000_000_000 + fraction
  return sign === '-' ? -result : result
}
