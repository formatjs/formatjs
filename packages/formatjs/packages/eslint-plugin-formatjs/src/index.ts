import enforceDescription from './rules/enforce-description';
import enforceDefaultMessage from './rules/enforce-default-message';
import noCamelCase from './rules/no-camel-case';
import noEmoji from './rules/no-emoji';
import noMultiplePlurals from './rules/no-multiple-plurals';
import noOffset from './rules/no-offset';
import blacklistElements from './rules/blacklist-elements';
import enforcePluralRules from './rules/enforce-plural-rules';
import enforcePlaceholders from './rules/enforce-placeholders';
import enforceSupportedDateTimeSkeleton from './rules/supported-datetime-skeleton';
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
    'supported-datetime-skeleton': enforceSupportedDateTimeSkeleton,
  },
};

export type Plugin = typeof plugin;

module.exports = plugin;
