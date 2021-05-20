const NUMBER = 10000
const ALL_ZEROS = /^0+$/
function partToPattern(part: Intl.NumberFormatPart): string {
  switch (part.type) {
    default:
      return part.value
    case 'currency':
    case 'compact':
      return `"${part.value}"`
    case 'integer':
      if (ALL_ZEROS.test(part.value)) {
        return part.value
          .split('')
          .map((_, i, arr) => (i === arr.length - 1 ? '0' : '#'))
          .join('')
      }
      return '#'
  }
}

export function generateNumFmtPattern(
  locales: string | string[],
  opts: Intl.NumberFormatOptions
) {
  const nf = new Intl.NumberFormat(locales, opts)
  const positivePattern = nf.formatToParts(NUMBER).reduce((pattern, part) => {
    return pattern + partToPattern(part)
  }, '')
  const negativePattern = nf.formatToParts(-NUMBER).reduce((pattern, part) => {
    return pattern + partToPattern(part)
  }, '')
  return positivePattern + ';' + negativePattern
}
