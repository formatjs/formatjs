import type {Linter} from 'eslint'
import type {ESLint} from 'eslint'
import {
  name as blocklistElementRuleName,
  rule as blocklistElements,
} from './rules/blocklist-elements.js'
import {
  rule as enforceDefaultMessage,
  name as enforceDefaultMessageName,
} from './rules/enforce-default-message.js'
import {
  rule as enforceDescription,
  name as enforceDescriptionName,
} from './rules/enforce-description.js'
import {rule as enforceId, name as enforceIdName} from './rules/enforce-id.js'
import {
  rule as enforcePlaceholders,
  name as enforcePlaceholdersName,
} from './rules/enforce-placeholders.js'
import {
  rule as enforcePluralRules,
  name as enforcePluralRulesName,
} from './rules/enforce-plural-rules.js'
import {
  rule as noCamelCase,
  name as noCamelCaseName,
} from './rules/no-camel-case.js'
import {
  rule as noComplexSelectors,
  name as noComplexSelectorsName,
} from './rules/no-complex-selectors.js'
import {rule as noEmoji, name as noEmojiName} from './rules/no-emoji.js'
import {rule as noId, name as noIdName} from './rules/no-id.js'
import {
  rule as noInvalidICU,
  name as noInvalidICUName,
} from './rules/no-invalid-icu.js'
import {
  rule as noLiteralStringInJsx,
  name as noLiteralStringInJsxName,
} from './rules/no-literal-string-in-jsx.js'
import {
  rule as noMissingIcuPluralOnePlaceholders,
  name as noMissingIcuPluralOnePlaceholdersName,
} from './rules/no-missing-icu-plural-one-placeholders.js'
import {
  rule as noMultiplePlurals,
  name as noMultiplePluralsName,
} from './rules/no-multiple-plurals.js'
import {
  rule as noMultipleWhitespaces,
  name as noMultipleWhitespacesName,
} from './rules/no-multiple-whitespaces.js'
import {rule as noOffset, name as noOffsetName} from './rules/no-offset.js'
import {
  rule as noUselessMessage,
  name as noUselessMessageName,
} from './rules/no-useless-message.js'
import {
  rule as preferFormattedMessage,
  name as preferFormattedMessageName,
} from './rules/prefer-formatted-message.js'
import {
  rule as preferPoundInPlural,
  name as preferPoundInPluralName,
} from './rules/prefer-pound-in-plural.js'
import {
  rule as noLiteralStringInObject,
  name as noLiteralStringInObjectName,
} from './rules/no-literal-string-in-object.js'

import * as packageJsonNs from './package.json' with {type: 'json'}

const packageJson = (packageJsonNs as any).default ?? packageJsonNs
const {name, version} = packageJson

// All rules
const rules: ESLint.Plugin['rules'] = {
  // @ts-expect-error
  [blocklistElementRuleName]: blocklistElements,
  // @ts-expect-error
  [enforceDefaultMessageName]: enforceDefaultMessage,
  // @ts-expect-error
  [enforceDescriptionName]: enforceDescription,
  // @ts-expect-error
  [enforceIdName]: enforceId,
  // @ts-expect-error
  [enforcePlaceholdersName]: enforcePlaceholders,
  // @ts-expect-error
  [enforcePluralRulesName]: enforcePluralRules,
  // @ts-expect-error
  [noCamelCaseName]: noCamelCase,
  // @ts-expect-error
  [noComplexSelectorsName]: noComplexSelectors,
  // @ts-expect-error
  [noEmojiName]: noEmoji,
  // @ts-expect-error
  [noIdName]: noId,
  // @ts-expect-error
  [noInvalidICUName]: noInvalidICU,
  // @ts-expect-error
  [noLiteralStringInJsxName]: noLiteralStringInJsx,
  // @ts-expect-error
  [noMultiplePluralsName]: noMultiplePlurals,
  // @ts-expect-error
  [noMultipleWhitespacesName]: noMultipleWhitespaces,
  // @ts-expect-error
  [noOffsetName]: noOffset,
  // @ts-expect-error
  [noUselessMessageName]: noUselessMessage,
  // @ts-expect-error
  [preferFormattedMessageName]: preferFormattedMessage,
  // @ts-expect-error
  [preferPoundInPluralName]: preferPoundInPlural,
  // @ts-expect-error
  [noMissingIcuPluralOnePlaceholdersName]: noMissingIcuPluralOnePlaceholders,
  // @ts-expect-error
  [noLiteralStringInObjectName]: noLiteralStringInObject,
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
    },
  },
}
plugin.configs = configs

export default plugin
