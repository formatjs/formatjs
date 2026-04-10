import type {Linter} from 'eslint'
import type {ESLint} from 'eslint'
import {
  name as blocklistElementRuleName,
  rule as blocklistElements,
} from '#packages/eslint-plugin-formatjs/rules/blocklist-elements.js'
import {
  rule as enforceDefaultMessage,
  name as enforceDefaultMessageName,
} from '#packages/eslint-plugin-formatjs/rules/enforce-default-message.js'
import {
  rule as enforceDescription,
  name as enforceDescriptionName,
} from '#packages/eslint-plugin-formatjs/rules/enforce-description.js'
import {
  rule as enforceId,
  name as enforceIdName,
} from '#packages/eslint-plugin-formatjs/rules/enforce-id.js'
import {
  rule as enforcePlaceholders,
  name as enforcePlaceholdersName,
} from '#packages/eslint-plugin-formatjs/rules/enforce-placeholders.js'
import {
  rule as enforcePluralRules,
  name as enforcePluralRulesName,
} from '#packages/eslint-plugin-formatjs/rules/enforce-plural-rules.js'
import {
  rule as noCamelCase,
  name as noCamelCaseName,
} from '#packages/eslint-plugin-formatjs/rules/no-camel-case.js'
import {
  rule as noComplexSelectors,
  name as noComplexSelectorsName,
} from '#packages/eslint-plugin-formatjs/rules/no-complex-selectors.js'
import {
  rule as noEmoji,
  name as noEmojiName,
} from '#packages/eslint-plugin-formatjs/rules/no-emoji.js'
import {
  rule as noId,
  name as noIdName,
} from '#packages/eslint-plugin-formatjs/rules/no-id.js'
import {
  rule as noInvalidICU,
  name as noInvalidICUName,
} from '#packages/eslint-plugin-formatjs/rules/no-invalid-icu.js'
import {
  rule as noLiteralStringInJsx,
  name as noLiteralStringInJsxName,
} from '#packages/eslint-plugin-formatjs/rules/no-literal-string-in-jsx.js'
import {
  rule as noMissingIcuPluralOnePlaceholders,
  name as noMissingIcuPluralOnePlaceholdersName,
} from '#packages/eslint-plugin-formatjs/rules/no-missing-icu-plural-one-placeholders.js'
import {
  rule as noMultiplePlurals,
  name as noMultiplePluralsName,
} from '#packages/eslint-plugin-formatjs/rules/no-multiple-plurals.js'
import {
  rule as noMultipleWhitespaces,
  name as noMultipleWhitespacesName,
} from '#packages/eslint-plugin-formatjs/rules/no-multiple-whitespaces.js'
import {
  rule as noOffset,
  name as noOffsetName,
} from '#packages/eslint-plugin-formatjs/rules/no-offset.js'
import {
  rule as noUselessMessage,
  name as noUselessMessageName,
} from '#packages/eslint-plugin-formatjs/rules/no-useless-message.js'
import {
  rule as preferFormattedMessage,
  name as preferFormattedMessageName,
} from '#packages/eslint-plugin-formatjs/rules/prefer-formatted-message.js'
import {
  rule as preferPoundInPlural,
  name as preferPoundInPluralName,
} from '#packages/eslint-plugin-formatjs/rules/prefer-pound-in-plural.js'
import {
  rule as noLiteralStringInObject,
  name as noLiteralStringInObjectName,
} from '#packages/eslint-plugin-formatjs/rules/no-literal-string-in-object.js'
import {
  rule as preferFullSentence,
  name as preferFullSentenceName,
} from '#packages/eslint-plugin-formatjs/rules/prefer-full-sentence.js'

import * as packageJsonNs from '#packages/eslint-plugin-formatjs/package.json' with {type: 'json'}

const packageJson = (packageJsonNs as any).default ?? packageJsonNs
const {name, version} = packageJson

// All rules
const rules: ESLint.Plugin['rules'] = {
  [blocklistElementRuleName]: blocklistElements,
  [enforceDefaultMessageName]: enforceDefaultMessage,
  [enforceDescriptionName]: enforceDescription,
  [enforceIdName]: enforceId,
  [enforcePlaceholdersName]: enforcePlaceholders,
  [enforcePluralRulesName]: enforcePluralRules,
  [noCamelCaseName]: noCamelCase,
  [noComplexSelectorsName]: noComplexSelectors,
  [noEmojiName]: noEmoji,
  [noIdName]: noId,
  [noInvalidICUName]: noInvalidICU,
  [noLiteralStringInJsxName]: noLiteralStringInJsx,
  [noMultiplePluralsName]: noMultiplePlurals,
  [noMultipleWhitespacesName]: noMultipleWhitespaces,
  [noOffsetName]: noOffset,
  [noUselessMessageName]: noUselessMessage,
  [preferFormattedMessageName]: preferFormattedMessage,
  [preferPoundInPluralName]: preferPoundInPlural,
  [noMissingIcuPluralOnePlaceholdersName]: noMissingIcuPluralOnePlaceholders,
  [noLiteralStringInObjectName]: noLiteralStringInObject,
  [preferFullSentenceName]: preferFullSentence,
}

type Plugin = {
  meta: {
    name: string
    version: string
  }
  rules: ESLint.Plugin['rules']
  configs: {
    strict: Linter.Config
    recommended: Linter.Config
  }
}

// Base plugin
const plugin: Plugin = {
  meta: {name, version},
  rules,
  configs: {} as Plugin['configs'], // will be populated later
}

// Configs
const configs: Plugin['configs'] = {
  strict: {
    name: 'formatjs/strict',
    plugins: {formatjs: plugin},
    rules: {
      'formatjs/no-offset': 'error',
      'formatjs/enforce-default-message': ['error', 'literal'],
      'formatjs/enforce-description': ['error', 'literal'],
      'formatjs/enforce-placeholders': 'error',
      'formatjs/no-emoji': 'error',
      'formatjs/no-multiple-whitespaces': 'error',
      'formatjs/no-multiple-plurals': 'error',
      'formatjs/no-complex-selectors': ['error', {limit: 20}],
      'formatjs/no-useless-message': 'error',
      'formatjs/prefer-pound-in-plural': 'error',
      'formatjs/no-missing-icu-plural-one-placeholders': 'error',
      'formatjs/enforce-id': [
        'error',
        {
          idInterpolationPattern: '[sha512:contenthash:base64:10]',
        },
      ],
      'formatjs/enforce-plural-rules': [
        'error',
        {
          one: true,
          other: true,
        },
      ],
      'formatjs/no-literal-string-in-jsx': [
        'error',
        {
          props: {
            include: [['*', '{label,placeholder,title}']],
          },
        },
      ],
      'formatjs/blocklist-elements': ['error', ['selectordinal']],
      'formatjs/prefer-full-sentence': 'error',
    },
  },
  recommended: {
    name: 'formatjs/recommended',
    plugins: {formatjs: plugin},
    rules: {
      'formatjs/no-offset': 'error',
      'formatjs/enforce-default-message': ['error', 'literal'],
      'formatjs/enforce-description': ['error', 'literal'],
      'formatjs/enforce-placeholders': 'error',
      'formatjs/no-emoji': 'error',
      'formatjs/no-multiple-whitespaces': 'error',
      'formatjs/no-multiple-plurals': 'error',
      'formatjs/no-complex-selectors': ['error', {limit: 20}],
      'formatjs/no-useless-message': 'error',
      'formatjs/prefer-pound-in-plural': 'error',
      'formatjs/no-missing-icu-plural-one-placeholders': 'error',
      'formatjs/enforce-plural-rules': [
        'error',
        {
          one: true,
          other: true,
        },
      ],
      'formatjs/no-literal-string-in-jsx': [
        'warn',
        {
          props: {
            include: [['*', '{label,placeholder,title}']],
          },
        },
      ],
      'formatjs/blocklist-elements': ['error', ['selectordinal']],
      'formatjs/prefer-full-sentence': 'error',
    },
  },
}
plugin.configs = configs

export default plugin
