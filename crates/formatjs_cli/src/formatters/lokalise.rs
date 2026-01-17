use serde_json::{json, Value};
use std::collections::BTreeMap;

use crate::extractor::MessageDescriptor;

/// Lokalise formatter: converts MessageDescriptor to {translation, notes} format
///
/// Format (extraction): Converts MessageDescriptor to Lokalise format with translation and notes fields
/// Compile (translation): Extracts translation field from Lokalise format
///
/// Format output:
/// ```json
/// {
///   "greeting": {
///     "translation": "Hello {name}!",
///     "notes": "Greeting message"
///   }
/// }
/// ```
pub fn format(messages: &BTreeMap<String, MessageDescriptor>) -> Value {
    let mut results = serde_json::Map::new();

    for (id, msg) in messages {
        let mut entry = serde_json::Map::new();

        if let Some(default_message) = &msg.default_message {
            entry.insert("translation".to_string(), json!(default_message));
        }

        if let Some(description) = &msg.description {
            let description_str = match description {
                Value::String(s) => s.clone(),
                other => serde_json::to_string(other).unwrap_or_default(),
            };
            entry.insert("notes".to_string(), json!(description_str));
        }

        results.insert(id.clone(), Value::Object(entry));
    }

    Value::Object(results)
}

pub fn compile(messages: &Value) -> BTreeMap<String, String> {
    let mut results = BTreeMap::new();

    if let Some(map) = messages.as_object() {
        for (id, value) in map {
            if let Some(obj) = value.as_object() {
                if let Some(translation_field) = obj.get("translation") {
                    if let Some(msg_str) = translation_field.as_str() {
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
    fn test_lokalise_formatter_basic() {
        let input = json!({
            "greeting": {
                "translation": "Hello {name}!",
                "notes": "Greeting message"
            },
            "farewell": {
                "translation": "Goodbye!",
                "context": "homepage"
            }
        });

        let result = compile(&input);
        assert_eq!(result.len(), 2);
        assert_eq!(result.get("greeting").unwrap(), "Hello {name}!");
        assert_eq!(result.get("farewell").unwrap(), "Goodbye!");
    }

    #[test]
    fn test_lokalise_formatter_missing_field() {
        let input = json!({
            "greeting": {
                "notes": "Greeting message"
            }
        });

        let result = compile(&input);
        assert_eq!(result.len(), 0);
    }

    #[test]
    fn test_lokalise_formatter_with_metadata() {
        let input = json!({
            "msg": {
                "translation": "{count, plural, one {# item} other {# items}}",
                "notes": "Item count",
                "context": "shopping cart",
                "limit": "50"
            }
        });

        let result = compile(&input);
        assert_eq!(
            result.get("msg").unwrap(),
            "{count, plural, one {# item} other {# items}}"
        );
    }
}
