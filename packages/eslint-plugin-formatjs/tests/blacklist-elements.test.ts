import blacklistElements from '../rules/blacklist-elements'
import {dynamicMessage, emptyFnCall, noMatch, spreadJsx} from './fixtures'
import {ruleTester, vueRuleTester} from './util'

ruleTester.run('blacklist-elements', blacklistElements, {
  valid: [
    {
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: '{count, plural, one {#} other {# more}}'
  })`,
      options: [['selectordinal']],
    },
    {
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: '{count, plural, one {#} other {# more}} <a href="asd"></a>'
  })`,
      options: [['selectordinal']],
      settings: {
        ignoreTag: true,
      },
    },
    {
      code: `
  $t({
      defaultMessage: '{count, plural, one {#} other {# more}}'
  })`,
      options: [['selectordinal']],
      settings: {
        additionalFunctionNames: ['$t'],
      },
    },
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
  ],
  invalid: [
    {
      code: `
              import {defineMessage} from 'react-intl'
              defineMessage({
                  defaultMessage: '{count, selectordinal, offset:1 one {#} other {# more}}'
              })`,
      options: [['selectordinal']],
      errors: [
        {
          message: 'selectordinal element is blacklisted',
        },
      ],
    },
    {
      code: `
              $t({
                  defaultMessage: '{count, selectordinal, offset:1 one {#} other {# more}}'
              })`,
      options: [['selectordinal']],
      settings: {
        additionalFunctionNames: ['$t'],
      },
      errors: [
        {
          message: 'selectordinal element is blacklisted',
        },
      ],
    },
  ],
})

vueRuleTester.run('vue/blacklist-elements', blacklistElements, {
  valid: [
    {
      code: `<template>
      <p>{{ $formatMessage({
        defaultMessage: '{count, plural, offset:1 one {#} other {# more} }'
      }) }} World!</p>
    </template>`,
      options: [['selectordinal']],
    },
    `<script>${dynamicMessage}</script>`,
    `<script>${noMatch}</script>`,
    `<script>${emptyFnCall}</script>`,
  ],
  invalid: [
    {
      code: `
              <script>
              intl.formatMessage({
                  defaultMessage: '{count, selectordinal, offset:1 one {#} other {# more}}'
              })</script>`,
      options: [['selectordinal']],
      errors: [
        {
          message: 'selectordinal element is blacklisted',
        },
      ],
    },
    {
      code: `
      <template>
  <p>{{ $formatMessage({
    defaultMessage: '{count, selectordinal, offset:1 one {#} other {# more} }'
  }) }} World!</p>
</template>`,
      options: [['selectordinal']],
      errors: [
        {
          message: 'selectordinal element is blacklisted',
        },
      ],
    },
  ],
})
