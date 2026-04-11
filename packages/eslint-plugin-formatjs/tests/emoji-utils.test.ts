import {describe, expect, it} from 'vitest'
import {
  hasEmoji,
  extractEmojis,
  getEmojiVersion,
  isValidEmojiVersion,
  filterEmojis,
} from '#packages/eslint-plugin-formatjs/emoji-utils.js'

describe('emoji-utils', () => {
  describe('hasEmoji', () => {
    it('should detect simple emoji', () => {
      expect(hasEmoji('Hello 😀 world')).toBe(true)
      expect(hasEmoji('😀')).toBe(true)
      expect(hasEmoji('Hello world')).toBe(false)
    })

    it('should NOT detect false positives (issue #5957)', () => {
      // Digits
      expect(hasEmoji('1')).toBe(false)
      expect(hasEmoji('0123456789')).toBe(false)
      expect(hasEmoji('Call 1-800-555-1234')).toBe(false)

      // Special characters
      expect(hasEmoji('#')).toBe(false)
      expect(hasEmoji('*')).toBe(false)
      expect(hasEmoji('#hashtag')).toBe(false)

      // Copyright/trademark symbols
      expect(hasEmoji('©')).toBe(false)
      expect(hasEmoji('™')).toBe(false)
      expect(hasEmoji('®')).toBe(false)
      expect(hasEmoji('© 2024 Company')).toBe(false)

      // Mixed text without emoji
      expect(hasEmoji('Task #1: Complete * 5 items')).toBe(false)
    })

    it('should detect variation selector emoji (issue #5957)', () => {
      expect(hasEmoji('❤️')).toBe(true) // Heart with VS
      expect(hasEmoji('☀️')).toBe(true) // Sun with VS
      expect(hasEmoji('I ❤️ this')).toBe(true)
    })

    it('should NOT detect regular text with variation selector as false positive', () => {
      expect(hasEmoji('Hello\uFE0F')).toBe(false) // Regular text + VS
      expect(hasEmoji('A\uFE0F')).toBe(false) // Letter + VS
      expect(hasEmoji('Text\uFE0Fmore')).toBe(false) // Text + VS + text
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

    it('should return correct versions for emoji across different Unicode versions', () => {
      // Version 0.6
      expect(getEmojiVersion('☺')).toBe('0.6') // Smiling face

      // Version 1.0
      expect(getEmojiVersion('😀')).toBe('1.0') // Grinning face

      // Version 4.0
      expect(getEmojiVersion('🤣')).toBe('3.0') // Rolling on floor laughing

      // Version 12.0
      expect(getEmojiVersion('🥱')).toBe('12.0') // Yawning face

      // Version 13.0
      expect(getEmojiVersion('🥲')).toBe('13.0') // Smiling face with tear

      // Version 14.0
      expect(getEmojiVersion('🫠')).toBe('14.0') // Melting face

      // Version 15.0
      expect(getEmojiVersion('🫏')).toBe('15.0') // Donkey
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

  describe('filterEmojis', () => {
    it('should filter emoji by version threshold', () => {
      const filter12 = filterEmojis('12.0')

      // Emoji from v1.0 (should pass)
      expect(filter12('😀')).toBe(true) // v1.0

      // Emoji from v12.0 (should pass)
      expect(filter12('🥱')).toBe(true) // v12.0

      // Emoji from v13.0 (should NOT pass)
      expect(filter12('🥲')).toBe(false) // v13.0

      // Emoji from v14.0 (should NOT pass)
      expect(filter12('🫠')).toBe(false) // v14.0

      // Emoji from v15.0 (should NOT pass)
      expect(filter12('🫏')).toBe(false) // v15.0
    })

    it('should allow newer emoji when threshold is higher', () => {
      const filter14 = filterEmojis('14.0')

      // Emoji from v13.0 (should pass)
      expect(filter14('🥲')).toBe(true) // v13.0

      // Emoji from v14.0 (should pass)
      expect(filter14('🫠')).toBe(true) // v14.0

      // Emoji from v15.0 (should NOT pass)
      expect(filter14('🫏')).toBe(false) // v15.0
    })

    it('should handle unknown emoji conservatively', () => {
      const filter12 = filterEmojis('12.0')

      // Unknown emoji should pass (conservative approach)
      expect(filter12('unknown')).toBe(true)
    })

    it('should filter based on base emoji version for complex sequences', () => {
      const filter12 = filterEmojis('12.0')

      // Waving hand is v0.6, should pass even with skin tone modifier
      expect(filter12('👋')).toBe(true) // v0.6
      expect(filter12('👋🏻')).toBe(true) // v0.6 base
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
