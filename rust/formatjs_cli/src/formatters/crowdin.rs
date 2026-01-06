use serde_json::{json, Value};
use std::collections::BTreeMap;

use crate::extractor::MessageDescriptor;

/// Crowdin formatter: converts MessageDescriptor to {message, description} format
///
/// Format (extraction): Converts MessageDescriptor to Crowdin format with message and description fields
/// Compile (translation): Extracts message field from Crowdin format, skipping "smartling" key
///
/// Format output:
/// ```json
/// {
///   "greeting": {
///     "message": "Hello {name}!",
///     "description": "Greeting message"
///   }
/// }
/// ```
pub fn format(messages: &BTreeMap<String, MessageDescriptor>) -> Value {
    let mut results = serde_json::Map::new();

    for (id, msg) in messages {
        let mut entry = serde_json::Map::new();

        if let Some(default_message) = &msg.default_message {
            entry.insert("message".to_string(), json!(default_message));
        }

        if let Some(description) = &msg.description {
            let description_str = match description {
                Value::String(s) => s.clone(),
                other => serde_json::to_string(other).unwrap_or_default(),
            };
            entry.insert("description".to_string(), json!(description_str));
        }

        results.insert(id.clone(), Value::Object(entry));
    }

    Value::Object(results)
}

pub fn compile(messages: &Value) -> BTreeMap<String, String> {
    let mut results = BTreeMap::new();

    if let Some(map) = messages.as_object() {
        for (id, value) in map {
            // Skip the smartling metadata key (compatibility with TS implementation)
            if id == "smartling" {
                continue;
            }

            if let Some(obj) = value.as_object() {
                if let Some(message_field) = obj.get("message") {
                    if let Some(msg_str) = message_field.as_str() {
                        results.insert(id.clone(), msg_str.to_string());
                    }
                }
            }
        }
    }

    results
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_crowdin_formatter_basic() {
        let input = json!({
            "greeting": {
                "message": "Hello {name}!",
                "description": "Greeting message"
            },
            "farewell": {
                "message": "Goodbye!"
            }
        });

        let result = compile(&input);
        assert_eq!(result.len(), 2);
        assert_eq!(result.get("greeting").unwrap(), "Hello {name}!");
        assert_eq!(result.get("farewell").unwrap(), "Goodbye!");
    }

    #[test]
    fn test_crowdin_formatter_skips_smartling_key() {
        let input = json!({
            "smartling": {
                "message": "Should be skipped"
            },
            "msg": {
                "message": "Test message"
            }
        });

        let result = compile(&input);
        assert_eq!(result.len(), 1);
        assert_eq!(result.get("msg").unwrap(), "Test message");
        assert!(result.get("smartling").is_none());
    }

    #[test]
    fn test_crowdin_formatter_missing_field() {
        let input = json!({
            "greeting": {
                "description": "Greeting message"
            }
        });

        let result = compile(&input);
        assert_eq!(result.len(), 0);
    }

    #[test]
    fn test_crowdin_formatter_icu_message() {
        let input = json!({
            "msg": {
                "message": "{count, plural, one {# item} other {# items}}",
                "description": "Item count"
            }
        });

        let result = compile(&input);
        assert_eq!(
            result.get("msg").unwrap(),
            "{count, plural, one {# item} other {# items}}"
        );
    }
}
