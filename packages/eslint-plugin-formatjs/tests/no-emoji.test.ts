import {ruleTester} from './util'
import {rule, name} from '../rules/no-emoji.js'

ruleTester.run(name, rule, {
  valid: [
    {
      // Digits should NOT be flagged as emoji (issue #5957)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'Step 1 of 5',
      description: 'asd'
  })`,
      options: [],
    },
    {
      // Hash symbol should NOT be flagged as emoji (issue #5957)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'Use #hashtag',
      description: 'asd'
  })`,
      options: [],
    },
    {
      // Asterisk should NOT be flagged as emoji (issue #5957)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'Required field *',
      description: 'asd'
  })`,
      options: [],
    },
    {
      // All digits should NOT be flagged (issue #5957)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'Numbers: 0123456789',
      description: 'asd'
  })`,
      options: [],
    },
    {
      // Phone numbers should NOT be flagged (issue #5957)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'Call us at 1-800-555-1234',
      description: 'asd'
  })`,
      options: [],
    },
    {
      // Copyright and trademark symbols (issue #5957)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: '© 2024 Company. All rights reserved.',
      description: 'asd'
  })`,
      options: [],
    },
    {
      // Mixed text with #, *, and digits (issue #5957)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'Task #1: Complete * 5 items',
      description: 'asd'
  })`,
      options: [],
    },
    {
      // Keycap symbols without variation selector (issue #5957)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'Press # to continue',
      description: 'asd'
  })`,
      options: [],
    },
    {
      // Text with plain text arrows (issue #5957)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'Go to Settings -> Profile',
      description: 'asd'
  })`,
      options: [],
    },
    {
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 😀',
      description: 'asd'
  })`,
      options: [{versionAbove: '12.0'}],
    },
    {
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 🤑',
      description: 'asd'
  })`,
      options: [{versionAbove: '12.0'}],
    },
    {
      // Unicode v14 - Melting Face
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 🫠',
      description: 'asd'
  })`,
      options: [{versionAbove: '14.0'}],
    },
    {
      // Unicode v15 - Donkey
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 🫏',
      description: 'asd'
  })`,
      options: [{versionAbove: '15.0'}],
    },
    {
      // Emoji with skin tone modifier
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 👋🏻',
      description: 'asd'
  })`,
      options: [{versionAbove: '12.0'}],
    },
    {
      // ZWJ sequence - family
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 👨‍👩‍👧‍👦',
      description: 'asd'
  })`,
      options: [{versionAbove: '12.0'}],
    },
    {
      // Flag sequence
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 🇺🇸',
      description: 'asd'
  })`,
      options: [{versionAbove: '12.0'}],
    },
    {
      // Unicode v0.6 - Smiling face - old emoji
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a ☺',
      description: 'asd'
  })`,
      options: [{versionAbove: '1.0'}],
    },
    {
      // Unicode v1.0 - Grinning face
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 😀',
      description: 'asd'
  })`,
      options: [{versionAbove: '3.0'}],
    },
    {
      // Unicode v3.0 - Rolling on floor laughing
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 🤣',
      description: 'asd'
  })`,
      options: [{versionAbove: '12.0'}],
    },
    {
      // Unicode v12.0 - Yawning face (at threshold)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 🥱',
      description: 'asd'
  })`,
      options: [{versionAbove: '12.0'}],
    },
    {
      // Unicode v13.0 - Smiling face with tear (valid with v14.0 threshold)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 🥲',
      description: 'asd'
  })`,
      options: [{versionAbove: '14.0'}],
    },
    {
      // Unicode v14.0 - Melting face (valid with v15.0 threshold)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 🫠',
      description: 'asd'
  })`,
      options: [{versionAbove: '15.0'}],
    },
  ],
  invalid: [
    {
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 😀',
      description: 'asd'
  })`,
      options: [],
      errors: [
        {
          messageId: 'notAllowed',
        },
      ],
    },
    {
      // Variation selector emoji SHOULD be detected (issue #5957)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'I ❤️ this',
      description: 'asd'
  })`,
      options: [],
      errors: [
        {
          messageId: 'notAllowed',
        },
      ],
    },
    {
      // Sun with variation selector SHOULD be detected (issue #5957)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'Sunny day ☀️',
      description: 'asd'
  })`,
      options: [],
      errors: [
        {
          messageId: 'notAllowed',
        },
      ],
    },
    {
      // Mixed content: digits should not trigger, but emoji should (issue #5957)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'Step 1: Click 😀',
      description: 'asd'
  })`,
      options: [],
      errors: [
        {
          messageId: 'notAllowed',
        },
      ],
    },
    {
      // Mixed content: # should not trigger, but emoji should (issue #5957)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'Use #hashtag with 🎉',
      description: 'asd'
  })`,
      options: [],
      errors: [
        {
          messageId: 'notAllowed',
        },
      ],
    },
    {
      // Unicode v15 - Donkey
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 🫏',
      description: 'asd'
  })`,
      options: [],
      errors: [
        {
          messageId: 'notAllowed',
        },
      ],
    },
    {
      // Unicode v13 - Smiling face with tears
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 🥲',
      description: 'asd'
  })`,
      options: [{versionAbove: '12.0'}],
      errors: [
        {
          messageId: 'notAllowedAboveVersion',
        },
      ],
    },
    {
      // Unicode v14 - Melting Face
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 🫠',
      description: 'asd'
  })`,
      options: [{versionAbove: '12.0'}],
      errors: [
        {
          messageId: 'notAllowedAboveVersion',
        },
      ],
    },
    {
      // Unicode v15 - Donkey
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 🫏',
      description: 'asd'
  })`,
      options: [{versionAbove: '12.0'}],
      errors: [
        {
          messageId: 'notAllowedAboveVersion',
        },
      ],
    },
    {
      // Emoji with skin tone modifier should be detected
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 👋🏻',
      description: 'asd'
  })`,
      options: [],
      errors: [
        {
          messageId: 'notAllowed',
        },
      ],
    },
    {
      // ZWJ sequence should be detected
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 👨‍👩‍👧‍👦',
      description: 'asd'
  })`,
      options: [],
      errors: [
        {
          messageId: 'notAllowed',
        },
      ],
    },
    {
      // Flag sequence should be detected
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 🇺🇸',
      description: 'asd'
  })`,
      options: [],
      errors: [
        {
          messageId: 'notAllowed',
        },
      ],
    },
    {
      // Unicode v1.0 - Grinning face (blocked with v0.6 threshold)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 😀',
      description: 'asd'
  })`,
      options: [{versionAbove: '0.6'}],
      errors: [
        {
          messageId: 'notAllowedAboveVersion',
        },
      ],
    },
    {
      // Unicode v3.0 - Rolling on floor laughing (blocked with v1.0 threshold)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 🤣',
      description: 'asd'
  })`,
      options: [{versionAbove: '1.0'}],
      errors: [
        {
          messageId: 'notAllowedAboveVersion',
        },
      ],
    },
    {
      // Unicode v12.0 - Yawning face (blocked with v3.0 threshold)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 🥱',
      description: 'asd'
  })`,
      options: [{versionAbove: '3.0'}],
      errors: [
        {
          messageId: 'notAllowedAboveVersion',
        },
      ],
    },
    {
      // Unicode v14.0 - Melting face (blocked with v13.0 threshold)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 🫠',
      description: 'asd'
  })`,
      options: [{versionAbove: '13.0'}],
      errors: [
        {
          messageId: 'notAllowedAboveVersion',
        },
      ],
    },
    {
      // Unicode v15.0 - Donkey (blocked with v13.0 threshold)
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a 🫏',
      description: 'asd'
  })`,
      options: [{versionAbove: '13.0'}],
      errors: [
        {
          messageId: 'notAllowedAboveVersion',
        },
      ],
    },
  ],
})
