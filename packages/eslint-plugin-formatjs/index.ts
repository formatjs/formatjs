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
import enforceId from './rules/enforce-id'
import enforcePlaceholders from './rules/enforce-placeholders'
import noInvalidICU from './rules/no-invalid-icu'
import enforcePluralRules from './rules/enforce-plural-rules'
import noCamelCase from './rules/no-camel-case'
import noComplexSelectors from './rules/no-complex-selectors'
import noEmoji from './rules/no-emoji'
import noId from './rules/no-id'
import noMultiplePlurals from './rules/no-multiple-plurals'
import noMultipleWhitespaces from './rules/no-multiple-whitespaces'
import noOffset from './rules/no-offset'
import noLiteralStringInJsx from './rules/no-literal-string-in-jsx'
import noUselessMessage from './rules/no-useless-message'
import preferFormattedMessage from './rules/prefer-formatted-message'
import preferPoundInPlural from './rules/prefer-pound-in-plural'
import {RuleModule} from '@typescript-eslint/utils/ts-eslint'

const plugin: Plugin = {
  rules: {
    [blocklistElementRuleName]: blocklistElements,
    [enforceDefaultMessageName]: enforceDefaultMessage,
    [enforceDescriptionName]: enforceDescription,
    'enforce-id': enforceId,
    'enforce-placeholders': enforcePlaceholders,
    'enforce-plural-rules': enforcePluralRules,
    'no-camel-case': noCamelCase,
    'no-complex-selectors': noComplexSelectors,
    'no-emoji': noEmoji,
    'no-id': noId,
    'no-invalid-icu': noInvalidICU,
    'no-literal-string-in-jsx': noLiteralStringInJsx,
    'no-multiple-plurals': noMultiplePlurals,
    'no-multiple-whitespaces': noMultipleWhitespaces,
    'no-offset': noOffset,
    'no-useless-message': noUselessMessage,
    'prefer-formatted-message': preferFormattedMessage,
    'prefer-pound-in-plural': preferPoundInPlural,
  },
}

export type Plugin = {
  rules: Record<string, RuleModule<string, readonly unknown[]>>
}

module.exports = plugin
