// Unicode White_Space property. This intentionally differs from JavaScript
// \s/String#trim for U+0085 and U+FEFF.
const TRIM_UNICODE_WHITE_SPACE_RE = /^\p{White_Space}+|\p{White_Space}+$/gu
const UNICODE_WHITE_SPACE_RE = /\p{White_Space}+/gu

export function normalizeMessageWhitespace(message: string): string {
  return message
    .replace(TRIM_UNICODE_WHITE_SPACE_RE, '')
    .replace(UNICODE_WHITE_SPACE_RE, ' ')
}
