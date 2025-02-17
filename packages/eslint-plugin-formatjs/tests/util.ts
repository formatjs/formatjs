import * as tsParser from '@typescript-eslint/parser'
import {RuleTester} from '@typescript-eslint/rule-tester'
import * as vueParser from 'vue-eslint-parser'
import {afterAll, describe, it} from 'vitest'

RuleTester.afterAll = afterAll
RuleTester.describe = describe
RuleTester.it = it
export const ruleTester: RuleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 6,
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
})

export const vueRuleTester: RuleTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: 6,
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: {
        globalReturn: false,
        jsx: false,
      },
    },
  },
})
