import enforceDescription from './rules/enforce-description';
import enforceDefaultMessage from './rules/enforce-default-message';
import noCamelCase from './rules/no-camel-case';
import noEmoji from './rules/no-emoji';
import noMultiplePlurals from './rules/no-multiple-plurals';
import noOffset from './rules/no-offset';
import blacklistElements from './rules/blacklist-elements';
import enforcePluralRules from './rules/enforce-plural-rules';
import enforcePlaceholders from './rules/enforce-placeholders';
import noMultipleWhitespaces from './rules/no-multiple-whitespaces';
import noId from './rules/no-id';
import enforceId from './rules/enforce-id';
const plugin = {
  rules: {
    'enforce-description': enforceDescription,
    'enforce-default-message': enforceDefaultMessage,
    'no-camel-case': noCamelCase,
    'no-emoji': noEmoji,
    'no-multiple-plurals': noMultiplePlurals,
    'no-offset': noOffset,
    'blacklist-elements': blacklistElements,
    'enforce-plural-rules': enforcePluralRules,
    'enforce-placeholders': enforcePlaceholders,
    'no-multiple-whitespaces': noMultipleWhitespaces,
    'no-id': noId,
    'enforce-id': enforceId,
  },
};

export type Plugin = typeof plugin;

module.exports = plugin;
