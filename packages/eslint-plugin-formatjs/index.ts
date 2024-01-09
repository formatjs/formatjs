import {
  rule as blocklistElements,
  name as blocklistElementRuleName,
} from './rules/blocklist-elements'
import {
  rule as enforceDefaultMessage,
  name as enforceDefaultMessageName,
} from './rules/enforce-default-message'
import {
  rule as enforceDescription,
  name as enforceDescriptionName,
} from './rules/enforce-description'
import {rule as enforceId, name as enforceIdName} from './rules/enforce-id'
import {
  rule as enforcePlaceholders,
  name as enforcePlaceholdersName,
} from './rules/enforce-placeholders'
import {
  rule as noInvalidICU,
  name as noInvalidICUName,
} from './rules/no-invalid-icu'
import {
  rule as enforcePluralRules,
  name as enforcePluralRulesName,
} from './rules/enforce-plural-rules'
import {
  rule as noCamelCase,
  name as noCamelCaseName,
} from './rules/no-camel-case'
import {
  rule as noComplexSelectors,
  name as noComplexSelectorsName,
} from './rules/no-complex-selectors'
import {rule as noEmoji, name as noEmojiName} from './rules/no-emoji'
import {rule as noId, name as noIdName} from './rules/no-id'
import {
  rule as noMultiplePlurals,
  name as noMultiplePluralsName,
} from './rules/no-multiple-plurals'
import {
  rule as noMultipleWhitespaces,
  name as noMultipleWhitespacesName,
} from './rules/no-multiple-whitespaces'
import {rule as noOffset, name as noOffsetName} from './rules/no-offset'
import {
  rule as noLiteralStringInJsx,
  name as noLiteralStringInJsxName,
} from './rules/no-literal-string-in-jsx'
import {
  rule as noUselessMessage,
  name as noUselessMessageName,
} from './rules/no-useless-message'
import preferFormattedMessage from './rules/prefer-formatted-message'
import preferPoundInPlural from './rules/prefer-pound-in-plural'
import {RuleModule} from '@typescript-eslint/utils/ts-eslint'

const plugin: Plugin = {
  rules: {
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
    'prefer-formatted-message': preferFormattedMessage,
    'prefer-pound-in-plural': preferPoundInPlural,
  },
}

export type Plugin = {
  rules: Record<string, RuleModule<string, readonly unknown[]>>
}

module.exports = plugin
