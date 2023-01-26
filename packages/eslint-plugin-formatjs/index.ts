import blocklistElements from './rules/blocklist-elements'
import enforceDefaultMessage from './rules/enforce-default-message'
import enforceDescription from './rules/enforce-description'
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

const plugin = {
  rules: {
    'blocklist-elements': blocklistElements,
    'enforce-default-message': enforceDefaultMessage,
    'enforce-description': enforceDescription,
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
  },
}

export type Plugin = typeof plugin

module.exports = plugin
