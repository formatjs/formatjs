use serde_json::{json, Value};
use std::collections::BTreeMap;

use crate::extractor::MessageDescriptor;

/// Simple formatter: converts MessageDescriptor to flat Record<string, string>
///
/// Format (extraction): Converts MessageDescriptor to Record<string, string> by extracting defaultMessage
/// Compile (translation): Pass-through since translations are already in Record<string, string> format
///
/// Format output:
/// ```json
/// {
///   "greeting": "Hello {name}!",
///   "farewell": "Goodbye!"
/// }
/// ```
pub fn format(messages: &BTreeMap<String, MessageDescriptor>) -> Value {
    let mut results = serde_json::Map::new();

    for (id, msg) in messages {
        if let Some(default_message) = &msg.default_message {
            results.insert(id.clone(), json!(default_message));
        }
    }

    Value::Object(results)
}

pub fn compile(messages: &Value) -> BTreeMap<String, String> {
    // Simple formatter: pass-through for Record<string, string>
    let mut results = BTreeMap::new();

    if let Some(map) = messages.as_object() {
        for (id, value) in map {
            if let Some(msg_str) = value.as_str() {
                results.insert(id.clone(), msg_str.to_string());
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
    fn test_simple_formatter_basic() {
        let input = json!({
            "greeting": "Hello {name}!",
            "farewell": "Goodbye!"
        });

        let result = compile(&input);
        assert_eq!(result.len(), 2);
        assert_eq!(result.get("greeting").unwrap(), "Hello {name}!");
        assert_eq!(result.get("farewell").unwrap(), "Goodbye!");
    }

    #[test]
    fn test_simple_formatter_wrong_type() {
        let input = json!({
            "greeting": "Hello!",
            "nested": {
                "message": "Should skip"
            }
        });

        let result = compile(&input);
        assert_eq!(result.len(), 1);
        assert_eq!(result.get("greeting").unwrap(), "Hello!");
        assert!(result.get("nested").is_none());
    }

    #[test]
    fn test_simple_formatter_icu_message() {
        let input = json!({
            "msg": "{count, plural, one {# item} other {# items}}"
        });

        let result = compile(&input);
        assert_eq!(
            result.get("msg").unwrap(),
            "{count, plural, one {# item} other {# items}}"
        );
    }
}
