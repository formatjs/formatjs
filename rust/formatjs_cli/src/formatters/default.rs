use serde_json::Value;
use std::collections::BTreeMap;

use crate::extractor::MessageDescriptor;

/// Default formatter: pass-through for MessageDescriptor objects
///
/// Format (extraction): Pass-through - returns MessageDescriptor objects as-is
/// Compile (translation): Extracts defaultMessage field from MessageDescriptor objects
///
/// Input format:
/// ```json
/// {
///   "greeting": {
///     "defaultMessage": "Hello {name}!",
///     "description": "Greeting message"
///   }
/// }
/// ```
///
/// Output: `{"greeting": "Hello {name}!"}`
pub fn format(messages: &BTreeMap<String, MessageDescriptor>) -> Value {
    // Serialize MessageDescriptor objects to JSON
    serde_json::to_value(messages).unwrap_or(Value::Null)
}

pub fn compile(messages: &Value) -> BTreeMap<String, String> {
    // In the default formatter, compilation is a no-op
    let mut results = BTreeMap::new();

    if let Some(r) = messages.as_object() {
        for (id, value) in r {
            if let Some(value) = value.as_object() {
                if let Some(default_message) = value.get("defaultMessage") {
                    if let Some(msg_str) = default_message.as_str() {
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
    fn test_default_formatter_basic() {
        let input = json!({
            "greeting": {
                "defaultMessage": "Hello {name}!",
                "description": "Greeting message"
            },
            "farewell": {
                "defaultMessage": "Goodbye!",
                "description": "Farewell message"
            }
        });

        let result = compile(&input);
        assert_eq!(result.len(), 2);
        assert_eq!(result.get("greeting").unwrap(), "Hello {name}!");
        assert_eq!(result.get("farewell").unwrap(), "Goodbye!");
    }

    #[test]
    fn test_default_formatter_missing_field() {
        let input = json!({
            "greeting": {
                "description": "Greeting message"
            }
        });

        let result = compile(&input);
        assert_eq!(result.len(), 0);
    }

    #[test]
    fn test_default_formatter_wrong_type() {
        let input = json!({
            "greeting": "Hello!"
        });

        let result = compile(&input);
        assert_eq!(result.len(), 0);
    }

    #[test]
    fn test_default_formatter_icu_message() {
        let input = json!({
            "msg": {
                "defaultMessage": "{count, plural, one {# item} other {# items}}"
            }
        });

        let result = compile(&input);
        assert_eq!(
            result.get("msg").unwrap(),
            "{count, plural, one {# item} other {# items}}"
        );
    }
}
