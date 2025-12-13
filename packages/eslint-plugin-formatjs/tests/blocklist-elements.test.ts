import {Element, name, rule} from '../rules/blocklist-elements.js'
import {dynamicMessage, emptyFnCall, noMatch, spreadJsx} from './fixtures'
import {ruleTester, vueRuleTester} from './util'

ruleTester.run(name, rule, {
  valid: [
    {
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: '{count, plural, one {#} other {# more}}'
  })`,
      options: [[Element.selectordinal]],
    },
    {
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: '{count, plural, one {#} other {# more}} <a href="asd"></a>'
  })`,
      options: [[Element.selectordinal]],
      settings: {
        formatjs: {
          ignoreTag: true,
        },
      },
    },
    {
      code: `
  $t({
      defaultMessage: '{count, plural, one {#} other {# more}}'
  })`,
      options: [[Element.selectordinal]],
      settings: {
        formatjs: {
          additionalFunctionNames: ['$t'],
        },
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
      options: [[Element.selectordinal]],
      errors: [
        {
          messageId: 'blocklist',
          data: {type: 'selectordinal'},
        },
      ],
    },
    {
      code: `
              $t({
                  defaultMessage: '{count, selectordinal, offset:1 one {#} other {# more}}'
              })`,
      options: [[Element.selectordinal]],
      settings: {
        formatjs: {
          additionalFunctionNames: ['$t'],
        },
      },
      errors: [
        {
          messageId: 'blocklist',
          data: {type: 'selectordinal'},
        },
      ],
    },
  ],
})

vueRuleTester.run(`vue-${name}`, rule, {
  valid: [
    {
      code: `<template>
      <p>{{ $formatMessage({
        defaultMessage: '{count, plural, offset:1 one {#} other {# more} }'
      }) }} World!</p>
    </template>`,
      options: [[Element.selectordinal]],
    },
    {code: `<script>${dynamicMessage.code}</script>`},
    {code: `<script>${noMatch.code}</script>`},
    {code: `<script>${emptyFnCall.code}</script>`},
  ],
  invalid: [
    {
      code: `
              <script>
              intl.formatMessage({
                  defaultMessage: '{count, selectordinal, offset:1 one {#} other {# more}}'
              })</script>`,
      options: [[Element.selectordinal]],
      errors: [
        {
          messageId: 'blocklist',
          data: {type: 'selectordinal'},
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
      options: [[Element.selectordinal]],
      errors: [
        {
          messageId: 'blocklist',
          data: {type: 'selectordinal'},
        },
      ],
    },
  ],
})
