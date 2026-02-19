import {RuleTester} from 'oxlint/plugins-dev'
import {RuleTester as EslintRuleTester} from 'eslint'
import type {Rule} from 'eslint'
import * as vueParser from 'vue-eslint-parser'
import {describe, it} from 'vitest'

RuleTester.describe = describe
RuleTester.it = it

interface TestCaseBase {
  code: string
  output?: string
  options?: unknown[]
  settings?: Record<string, unknown>
}

interface ValidTestCase extends TestCaseBase {}

interface InvalidTestCase extends TestCaseBase {
  errors: Array<{
    message?: string
    messageId?: string
    data?: Record<string, unknown>
  }>
}

interface EslintCompatRuleTester {
  run(
    name: string,
    rule: Rule.RuleModule,
    tests: {
      valid: Array<string | ValidTestCase>
      invalid: Array<InvalidTestCase>
    }
  ): void
}

// @ts-expect-error oxlint RuleTester accepts ESLint Rule.RuleModule in eslintCompat mode
export const ruleTester: EslintCompatRuleTester = new RuleTester({
  eslintCompat: true,
  languageOptions: {
    sourceType: 'module',
    parserOptions: {
      lang: 'tsx',
    },
  },
})

export const vueRuleTester: EslintRuleTester = new EslintRuleTester({
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
