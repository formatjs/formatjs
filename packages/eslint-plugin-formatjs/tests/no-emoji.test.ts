import {ruleTester} from './util'
import {rule, name} from '../rules/no-emoji.js'

ruleTester.run(name, rule, {
  valid: [
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
  ],
})
