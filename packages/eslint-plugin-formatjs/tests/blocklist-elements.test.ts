import {
  Element,
  name,
  rule,
} from '#packages/eslint-plugin-formatjs/rules/blocklist-elements.js'
import {
  dynamicMessage,
  emptyFnCall,
  noMatch,
  spreadJsx,
} from '#packages/eslint-plugin-formatjs/tests/fixtures'
import {
  ruleTester,
  vueRuleTester,
} from '#packages/eslint-plugin-formatjs/tests/util'

const genderSelect = {
  type: Element.select,
  allow: {variable: 'gender', options: ['male', 'female', 'other']},
}

ruleTester.run(name, rule, {
  valid: [
    {
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: '{gender, select, female {She} male {He} other {They}}'
  })`,
      options: [[genderSelect]],
    },
    {
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: '{foo}'
  })`,
      options: [[{type: Element.argument, allow: {variable: 'foo'}}]],
    },
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
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: '{status, select, male {He} female {She} other {They}}'
  })`,
      options: [[genderSelect]],
      errors: [{messageId: 'blocklist', data: {type: 'select'}}],
    },
    {
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: '{gender, select, male {He} other {They}}'
  })`,
      options: [[genderSelect]],
      errors: [{messageId: 'blocklist', data: {type: 'select'}}],
    },
    {
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: '{gender, select, male {He} female {She} nonbinary {They} other {They}}'
  })`,
      options: [[genderSelect]],
      errors: [{messageId: 'blocklist', data: {type: 'select'}}],
    },
    {
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: '{gender, select, male {{status, select, active {He} other {They}}} female {She} other {They}}'
  })`,
      options: [[genderSelect]],
      errors: [{messageId: 'blocklist', data: {type: 'select'}}],
    },
    {
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: '<strong>{status, select, active {Active} other {Inactive}}</strong>'
  })`,
      options: [[genderSelect]],
      errors: [{messageId: 'blocklist', data: {type: 'select'}}],
    },
    {
      code: `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: '{bar}'
  })`,
      options: [[{type: Element.argument, allow: {variable: 'foo'}}]],
      errors: [{messageId: 'blocklist', data: {type: 'argument'}}],
    },
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
        defaultMessage: '{gender, select, male {He} female {She} other {They} }'
      }) }}</p>
    </template>`,
      options: [[genderSelect]],
    },
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
      code: `<template>
      <p>{{ $formatMessage({
        defaultMessage: '{status, select, active {Active} other {Inactive} }'
      }) }}</p>
    </template>`,
      options: [[genderSelect]],
      errors: [{messageId: 'blocklist', data: {type: 'select'}}],
    },
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
