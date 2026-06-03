function outputDelimiter(key: string, value: string): string {
  const normalizedKey = key.replace(/[^A-Za-z0-9_]/g, '_')
  const baseDelimiter = `FORMATJS_${normalizedKey}_EOF`
  const lines = new Set(value.split(/\r?\n/))
  let delimiter = baseDelimiter
  let suffix = 0

  while (lines.has(delimiter)) {
    suffix++
    delimiter = `${baseDelimiter}_${suffix}`
  }

  return delimiter
}

export function githubOutputRecord(key: string, value): string {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value)
  if (!serialized.includes('\n') && !serialized.includes('\r')) {
    return `${key}=${serialized}\n`
  }

  const delimiter = outputDelimiter(key, serialized)
  return `${key}<<${delimiter}\n${serialized}\n${delimiter}\n`
}
