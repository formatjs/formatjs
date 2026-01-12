/**
 * Emoji detection utilities using Intl.Segmenter
 */

import {
  EMOJI_VERSIONS,
  EMOJI_RANGES,
  type EmojiVersion,
} from './emoji-data.generated.js'

export type {EmojiVersion} from './emoji-data.generated.js'

/**
 * Cached Intl.Segmenter instance for emoji extraction
 * Reused across all extractEmojis calls for better performance
 */
const graphemeSegmenter = new Intl.Segmenter('en', {granularity: 'grapheme'})

/**
 * Check if a string contains any emoji
 * Uses Unicode \p{Emoji} property which covers all emoji
 */
export function hasEmoji(text: string): boolean {
  // Use \p{Emoji} to match emoji characters
  // This includes all emoji, both text and emoji presentation
  return /\p{Emoji}/u.test(text)
}

/**
 * Extract all emoji from a string using Intl.Segmenter
 * Returns an array of emoji characters (including multi-codepoint sequences)
 *
 * Uses grapheme segmentation to properly handle:
 * - Emoji with skin tone modifiers (🙋🏻)
 * - ZWJ sequences (👨‍👩‍👧‍👦)
 * - Flag sequences (🇺🇸)
 * - Regional indicator sequences
 * - Any other complex emoji grapheme clusters
 */
export function extractEmojis(text: string): string[] {
  const segments = graphemeSegmenter.segment(text)
  const emojis: string[] = []

  for (const {segment} of segments) {
    // Check if this grapheme cluster contains emoji
    if (/\p{Emoji}/u.test(segment)) {
      emojis.push(segment)
    }
  }

  return emojis
}

/**
 * Check if a version string is a valid emoji version
 */
export function isValidEmojiVersion(version: string): boolean {
  return EMOJI_VERSIONS.includes(version as EmojiVersion)
}

/**
 * Get the Unicode version for a given emoji character
 * Returns undefined if the emoji is not found in our data
 */
export function getEmojiVersion(emoji: string): EmojiVersion | undefined {
  // Get the first codepoint from the emoji
  const codepoint = emoji.codePointAt(0)
  if (codepoint === undefined) {
    return undefined
  }

  // Check which range this codepoint falls into
  for (const range of EMOJI_RANGES) {
    if (codepoint >= range.start && codepoint <= range.end) {
      return range.version
    }
  }

  return undefined
}

/**
 * Filter function for emoji versions
 * Returns a filter function that checks if an emoji is from version or below
 */
export function filterEmojis(
  version: EmojiVersion
): (emoji: string) => boolean {
  const maxVersion = parseVersion(version)
  return (emoji: string) => {
    const emojiVersion = getEmojiVersion(emoji)
    if (!emojiVersion) {
      // If we don't have version data, assume it's an older emoji
      // This is a conservative approach for unknown emoji
      return true
    }
    return parseVersion(emojiVersion) <= maxVersion
  }
}

/**
 * Get all emoji that match the filter
 * Generates emoji from codepoint ranges and filters them
 */
export function getAllEmojis(filter: (emoji: string) => boolean): string[] {
  const emojis: string[] = []

  for (const range of EMOJI_RANGES) {
    for (let codepoint = range.start; codepoint <= range.end; codepoint++) {
      const emoji = String.fromCodePoint(codepoint)
      if (filter(emoji)) {
        emojis.push(emoji)
      }
    }
  }

  return emojis
}

/**
 * Parse version string to comparable number
 * e.g., "12.0" -> 12.0, "13.1" -> 13.1
 */
function parseVersion(version: string): number {
  return parseFloat(version)
}
