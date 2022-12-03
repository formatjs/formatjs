import {ruleTester} from './util'
import noEmoji from '../rules/no-emoji'

ruleTester.run('no-emoji', noEmoji, {
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
  ],
})
