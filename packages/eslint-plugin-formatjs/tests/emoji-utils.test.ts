import {describe, expect, it} from 'vitest'
import {
  hasEmoji,
  extractEmojis,
  getEmojiVersion,
  isValidEmojiVersion,
} from '../emoji-utils.js'

describe('emoji-utils', () => {
  describe('hasEmoji', () => {
    it('should detect simple emoji', () => {
      expect(hasEmoji('Hello 😀 world')).toBe(true)
      expect(hasEmoji('😀')).toBe(true)
      expect(hasEmoji('Hello world')).toBe(false)
    })

    it('should detect emoji with skin tone modifiers', () => {
      expect(hasEmoji('👋🏻')).toBe(true) // Waving hand: light skin tone
      expect(hasEmoji('👋🏿')).toBe(true) // Waving hand: dark skin tone
      expect(hasEmoji('🙋🏻‍♀️')).toBe(true) // Woman raising hand: light skin tone
    })

    it('should detect ZWJ sequences', () => {
      expect(hasEmoji('👨‍👩‍👧‍👦')).toBe(true) // Family: man, woman, girl, boy
      expect(hasEmoji('👨‍💻')).toBe(true) // Man technologist
      expect(hasEmoji('🧑‍⚕️')).toBe(true) // Health worker
    })

    it('should detect flag sequences', () => {
      expect(hasEmoji('🇺🇸')).toBe(true) // US flag
      expect(hasEmoji('🇬🇧')).toBe(true) // UK flag
      expect(hasEmoji('🇯🇵')).toBe(true) // Japan flag
    })

    it('should detect regional indicators', () => {
      expect(hasEmoji('🇦🇧')).toBe(true) // Regional indicators
    })
  })

  describe('extractEmojis', () => {
    it('should extract simple emoji', () => {
      expect(extractEmojis('Hello 😀 world 🌍')).toEqual(['😀', '🌍'])
      expect(extractEmojis('😀😁😂')).toEqual(['😀', '😁', '😂'])
    })

    it('should extract emoji with skin tone modifiers as single graphemes', () => {
      const emojis = extractEmojis('👋🏻 👋🏿')
      expect(emojis).toHaveLength(2)
      expect(emojis[0]).toBe('👋🏻') // Waving hand: light skin tone (single grapheme)
      expect(emojis[1]).toBe('👋🏿') // Waving hand: dark skin tone (single grapheme)
    })

    it('should extract ZWJ sequences as single graphemes', () => {
      const emojis = extractEmojis('Family: 👨‍👩‍👧‍👦')
      expect(emojis).toHaveLength(1)
      expect(emojis[0]).toBe('👨‍👩‍👧‍👦') // Family (single grapheme cluster)
    })

    it('should extract flag sequences as single graphemes', () => {
      const emojis = extractEmojis('Flags: 🇺🇸 🇬🇧 🇯🇵')
      expect(emojis).toHaveLength(3)
      expect(emojis[0]).toBe('🇺🇸') // US flag
      expect(emojis[1]).toBe('🇬🇧') // UK flag
      expect(emojis[2]).toBe('🇯🇵') // Japan flag
    })

    it('should handle mixed content', () => {
      const text = 'Hello 😀 with 👋🏻 and 👨‍👩‍👧‍👦 family'
      const emojis = extractEmojis(text)
      expect(emojis).toHaveLength(3)
      expect(emojis[0]).toBe('😀')
      expect(emojis[1]).toBe('👋🏻')
      expect(emojis[2]).toBe('👨‍👩‍👧‍👦')
    })

    it('should handle emoji with variation selectors', () => {
      const emojis = extractEmojis('❤️ ☀️') // Heart and sun with variation selector
      expect(emojis.length).toBeGreaterThan(0)
      expect(emojis).toContain('❤️')
      expect(emojis).toContain('☀️')
    })
  })

  describe('getEmojiVersion', () => {
    it('should return version for simple emoji', () => {
      expect(getEmojiVersion('😀')).toBe('1.0') // Grinning face
      expect(getEmojiVersion('©')).toBe('0.6') // Copyright
      expect(getEmojiVersion('™')).toBe('0.6') // Trademark
    })

    it('should return version for base emoji in complex sequences', () => {
      // Note: For complex emoji, we check the first codepoint
      // Skin tone modifiers don't change the base emoji version
      const waveVersion = getEmojiVersion('👋') // Base waving hand (U+1F44B)
      const waveWithSkinToneVersion = getEmojiVersion('👋🏻') // With skin tone
      // Both should report the same version for the base emoji codepoint
      expect(waveVersion).toBe('0.6') // Waving hand is version 0.6
      expect(waveWithSkinToneVersion).toBe('0.6') // First codepoint is 👋 (0.6)
    })

    it('should return undefined for unknown emoji', () => {
      expect(getEmojiVersion('not an emoji')).toBeUndefined()
      expect(getEmojiVersion('')).toBeUndefined()
    })

    it('should return version for regional indicators', () => {
      const usFlag = '🇺🇸' // U+1F1FA U+1F1F8
      const version = getEmojiVersion(usFlag)
      expect(version).toBe('0.0') // Regional indicators are version 0.0
    })
  })

  describe('isValidEmojiVersion', () => {
    it('should validate emoji versions', () => {
      expect(isValidEmojiVersion('0.6')).toBe(true)
      expect(isValidEmojiVersion('1.0')).toBe(true)
      expect(isValidEmojiVersion('12.0')).toBe(true)
      expect(isValidEmojiVersion('17.0')).toBe(true)
    })

    it('should reject invalid versions', () => {
      expect(isValidEmojiVersion('12.1')).toBe(false)
      expect(isValidEmojiVersion('13.1')).toBe(false)
      expect(isValidEmojiVersion('100.0')).toBe(false)
      expect(isValidEmojiVersion('invalid')).toBe(false)
    })
  })
})
