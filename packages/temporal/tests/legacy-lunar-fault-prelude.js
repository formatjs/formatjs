// Force stale host data so Hermes exercises correction, even with matching ICU.
;(function () {
  const prototype = Intl.DateTimeFormat.prototype
  const parts = prototype.formatToParts
  const resolved = prototype.resolvedOptions
  const instant = Date.UTC(2030, 2, 3)
  let injections = 0
  prototype.formatToParts = function (value) {
    const result = parts.call(this, value)
    if (value !== instant || resolved.call(this).calendar !== 'chinese')
      return result
    injections++
    const stale = new Map(
      parts
        .call(this, Date.UTC(2031, 7, 1))
        .map(part => [part.type, part.value])
    )
    return result.map(part =>
      ['relatedYear', 'yearName', 'month', 'day'].includes(part.type) &&
      stale.has(part.type)
        ? {...part, value: stale.get(part.type)}
        : part
    )
  }
  globalThis.__formatjsCheckLunarCorrection = function () {
    const formatter = new Intl.DateTimeFormat('en-US', {
      calendar: 'chinese',
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const corrected = new Map(
      formatter.formatToParts(instant).map(part => [part.type, part.value])
    )
    if (
      corrected.get('day') !== '29' ||
      corrected.get('relatedYear') !== '2030' ||
      injections === 0
    )
      throw new Error('Stale host lunar fields were not corrected')
    const range = formatter.formatRangeToParts(instant, instant + 86400000)
    if (
      !range.some(part => part.source === 'startRange') ||
      !range.some(part => part.source === 'endRange') ||
      formatter.formatRange(instant, instant + 86400000) !==
        range.map(part => part.value).join('')
    )
      throw new Error('Stale host lunar range was not corrected')
    delete globalThis.__formatjsCheckLunarCorrection
  }
})()
