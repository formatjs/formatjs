// Pinned ICU4X 2.3 / CLDR TS profiles. Both sides asserted; no skipped cases.
// ECMA-402 makes boundaries and word-like status implementation-defined.
// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/segmenter.html#L372
// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/segmenter.html#L406
export const profiles = [
  // ICU excludes mark-only/emoji segments; TS counts Unicode marks as words.
  {
    locales: ['en', 'en-GB', 'fr', 'de', 'ja', 'th', 'zh'],
    granularity: 'word',
    input: '\ud83c\udde6\u0308\ud83c\udde6',
    rust: [[[55356, 56806, 776, 55356, 56806], false]],
    typescript: [[[55356, 56806, 776, 55356, 56806], true]],
  },
  // ICU dictionary/LSTM words; TS uses CLDR break-rule boundaries.
  {
    locales: ['en', 'en-GB', 'fr', 'de', 'th', 'zh'],
    granularity: 'word',
    input: '\u3053\u3093\u306b\u3061\u306f\u4e16\u754c',
    rust: [
      [[12371, 12435, 12395, 12385, 12399], true],
      [[19990, 30028], true],
    ],
    typescript: [
      [[12371], true],
      [[12435], true],
      [[12395], true],
      [[12385], true],
      [[12399], true],
      [[19990], true],
      [[30028], true],
    ],
  },
  // ICU dictionary/LSTM words; TS uses CLDR break-rule boundaries.
  {
    locales: ['en', 'en-GB', 'fr', 'de', 'th', 'zh'],
    granularity: 'word',
    input: '\u4f60\u597d\u4e16\u754c',
    rust: [
      [[20320, 22909], true],
      [[19990, 30028], true],
    ],
    typescript: [
      [[20320], true],
      [[22909], true],
      [[19990], true],
      [[30028], true],
    ],
  },
  // ICU dictionary/LSTM words; TS uses CLDR break-rule boundaries.
  {
    locales: ['en', 'en-GB', 'fr', 'de', 'ja', 'th', 'zh'],
    granularity: 'word',
    input:
      '\u0e17\u0e38\u0e01\u0e2a\u0e2d\u0e07\u0e2a\u0e31\u0e1b\u0e14\u0e32\u0e2b\u0e4c',
    rust: [
      [[3607, 3640, 3585], true],
      [[3626, 3629, 3591], true],
      [[3626, 3633, 3611, 3604, 3634, 3627, 3660], true],
    ],
    typescript: [
      [[3607, 3640], true],
      [[3585], true],
      [[3626], true],
      [[3629], true],
      [[3591], true],
      [[3626, 3633], true],
      [[3611], true],
      [[3604], true],
      [[3634], true],
      [[3627, 3660], true],
    ],
  },
  // UAX #29 WB4 ignores Format inside words; TS has a known rule gap.
  {
    locales: ['en', 'en-GB', 'fr', 'de', 'ja', 'th', 'zh'],
    granularity: 'word',
    input: '\u2060c\u2060.\u2060D\u2060\u2060',
    rust: [
      [[8288], false],
      [[99, 8288, 46, 8288, 68, 8288, 8288], true],
    ],
    typescript: [
      [[8288], false],
      [[99, 8288, 46, 8288], true],
      [[68, 8288, 8288], true],
    ],
  },
  // ICU excludes mark-only/emoji segments; TS counts Unicode marks as words.
  {
    locales: ['en', 'en-GB', 'fr', 'de', 'ja', 'th', 'zh'],
    granularity: 'word',
    input: '\u0308',
    rust: [[[776], false]],
    typescript: [[[776], true]],
  },
  // ICU excludes mark-only/emoji segments; TS counts Unicode marks as words.
  {
    locales: ['en', 'en-GB', 'fr', 'ja', 'th', 'zh'],
    granularity: 'word',
    input: '\u2764\ufe0f',
    rust: [[[10084, 65039], false]],
    typescript: [[[10084, 65039], true]],
  },
  // TS applies CLDR abbreviation suppressions; ICU uses sentence break rules.
  {
    locales: ['en', 'en-GB', 'de'],
    granularity: 'sentence',
    input: 'Mr. Smith went home. Next day.',
    rust: [
      [[77, 114, 46, 32]],
      [
        [
          83, 109, 105, 116, 104, 32, 119, 101, 110, 116, 32, 104, 111, 109,
          101, 46, 32,
        ],
      ],
      [[78, 101, 120, 116, 32, 100, 97, 121, 46]],
    ],
    typescript: [
      [
        [
          77, 114, 46, 32, 83, 109, 105, 116, 104, 32, 119, 101, 110, 116, 32,
          104, 111, 109, 101, 46, 32,
        ],
      ],
      [[78, 101, 120, 116, 32, 100, 97, 121, 46]],
    ],
  },
  // UAX #29 Format/Close/Sp handling differs from the TS rule engine.
  {
    locales: ['en', 'en-GB', 'fr', 'de', 'ja', 'th', 'zh'],
    granularity: 'sentence',
    input: 'etc.)\u2019\u00a0\u2018(the',
    rust: [[[101, 116, 99, 46, 41, 8217, 160, 8216, 40, 116, 104, 101]]],
    typescript: [
      [[101, 116, 99, 46, 41, 8217, 160]],
      [[8216, 40, 116, 104, 101]],
    ],
  },
  // UAX #29 SB3/SB4 break after CRLF; TS suppression joins this sequence.
  {
    locales: ['en', 'en-GB', 'de'],
    granularity: 'sentence',
    input: 'A.\r\nA',
    rust: [[[65, 46, 13, 10]], [[65]]],
    typescript: [[[65, 46, 13, 10, 65]]],
  },
  // UAX #29 Format/Close/Sp handling differs from the TS rule engine.
  {
    locales: ['en', 'en-GB', 'fr', 'de', 'ja', 'th', 'zh'],
    granularity: 'sentence',
    input: '\u2060c\u2060.\u2060D\u2060\u2060',
    rust: [[[8288, 99, 8288, 46, 8288, 68, 8288, 8288]]],
    typescript: [[[8288, 99, 8288, 46, 8288]], [[68, 8288, 8288]]],
  },
  // ICU excludes mark-only/emoji segments; TS counts Unicode marks as words.
  {
    locales: ['de'],
    granularity: 'word',
    input: '\u2764\ufe0f',
    rust: [[[10084, 65039], false]],
    typescript: [[[10084, 65039], true]],
  },
  // TS applies CLDR abbreviation suppressions; ICU uses sentence break rules.
  {
    locales: ['de'],
    granularity: 'sentence',
    input: 'Dr. Jones arrived. She waved.',
    rust: [
      [[68, 114, 46, 32]],
      [[74, 111, 110, 101, 115, 32, 97, 114, 114, 105, 118, 101, 100, 46, 32]],
      [[83, 104, 101, 32, 119, 97, 118, 101, 100, 46]],
    ],
    typescript: [
      [
        [
          68, 114, 46, 32, 74, 111, 110, 101, 115, 32, 97, 114, 114, 105, 118,
          101, 100, 46, 32,
        ],
      ],
      [[83, 104, 101, 32, 119, 97, 118, 101, 100, 46]],
    ],
  },
  // ICU dictionary/LSTM words; TS uses CLDR break-rule boundaries.
  {
    locales: ['ja'],
    granularity: 'word',
    input: '\u4f60\u597d\u4e16\u754c',
    rust: [
      [[20320, 22909], true],
      [[19990, 30028], true],
    ],
    typescript: [[[20320, 22909, 19990, 30028], true]],
  },
] as const
