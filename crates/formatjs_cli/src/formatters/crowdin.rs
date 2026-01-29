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

    // ==================== Compile Tests (Translation Input) ====================

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

    // ==================== Format Tests (Extraction Output) ====================

    #[test]
    fn test_crowdin_format_basic() {
        // Test that format() outputs the correct Crowdin translation file format
        let mut messages = BTreeMap::new();
        messages.insert(
            "greeting".to_string(),
            MessageDescriptor {
                id: Some("greeting".to_string()),
                default_message: Some("Hello {name}!".to_string()),
                description: Some(json!("Greeting message shown to users")),
                file: None,
                start: None,
                end: None,
            },
        );

        let result = format(&messages);

        // Verify the output format matches Crowdin's expected structure
        assert!(result.is_object());
        let obj = result.as_object().unwrap();

        // Should have one entry
        assert_eq!(obj.len(), 1);

        // Verify the greeting entry has correct structure
        let greeting = obj.get("greeting").unwrap();
        assert!(greeting.is_object());

        let greeting_obj = greeting.as_object().unwrap();
        assert_eq!(greeting_obj.get("message").unwrap(), "Hello {name}!");
        assert_eq!(
            greeting_obj.get("description").unwrap(),
            "Greeting message shown to users"
        );
    }

    #[test]
    fn test_crowdin_format_without_description() {
        // Test that format() handles messages without descriptions
        let mut messages = BTreeMap::new();
        messages.insert(
            "simple".to_string(),
            MessageDescriptor {
                id: Some("simple".to_string()),
                default_message: Some("Simple message".to_string()),
                description: None,
                file: None,
                start: None,
                end: None,
            },
        );

        let result = format(&messages);

        let obj = result.as_object().unwrap();
        let simple = obj.get("simple").unwrap().as_object().unwrap();

        // Should have message field
        assert_eq!(simple.get("message").unwrap(), "Simple message");
        // Should NOT have description field when description is None
        assert!(simple.get("description").is_none());
    }

    #[test]
    fn test_crowdin_format_multiple_messages() {
        // Test that format() correctly handles multiple messages
        let mut messages = BTreeMap::new();
        messages.insert(
            "greeting".to_string(),
            MessageDescriptor {
                id: Some("greeting".to_string()),
                default_message: Some("Hello!".to_string()),
                description: Some(json!("Greeting")),
                file: None,
                start: None,
                end: None,
            },
        );
        messages.insert(
            "farewell".to_string(),
            MessageDescriptor {
                id: Some("farewell".to_string()),
                default_message: Some("Goodbye!".to_string()),
                description: Some(json!("Farewell")),
                file: None,
                start: None,
                end: None,
            },
        );

        let result = format(&messages);

        let obj = result.as_object().unwrap();
        assert_eq!(obj.len(), 2);
        assert_eq!(
            obj.get("greeting")
                .unwrap()
                .as_object()
                .unwrap()
                .get("message")
                .unwrap(),
            "Hello!"
        );
        assert_eq!(
            obj.get("farewell")
                .unwrap()
                .as_object()
                .unwrap()
                .get("message")
                .unwrap(),
            "Goodbye!"
        );
    }

    #[test]
    fn test_crowdin_format_icu_plural() {
        // Test that format() preserves ICU MessageFormat syntax
        let mut messages = BTreeMap::new();
        messages.insert(
            "items".to_string(),
            MessageDescriptor {
                id: Some("items".to_string()),
                default_message: Some("{count, plural, one {# item} other {# items}}".to_string()),
                description: Some(json!("Item count display")),
                file: None,
                start: None,
                end: None,
            },
        );

        let result = format(&messages);

        let obj = result.as_object().unwrap();
        let items = obj.get("items").unwrap().as_object().unwrap();

        assert_eq!(
            items.get("message").unwrap(),
            "{count, plural, one {# item} other {# items}}"
        );
        assert_eq!(items.get("description").unwrap(), "Item count display");
    }

    #[test]
    fn test_crowdin_format_icu_select() {
        // Test that format() preserves ICU select syntax
        let mut messages = BTreeMap::new();
        messages.insert(
            "gender_greeting".to_string(),
            MessageDescriptor {
                id: Some("gender_greeting".to_string()),
                default_message: Some(
                    "{gender, select, male {Mr.} female {Ms.} other {Dear}} {name}".to_string(),
                ),
                description: Some(json!("Gender-aware greeting")),
                file: None,
                start: None,
                end: None,
            },
        );

        let result = format(&messages);

        let obj = result.as_object().unwrap();
        let greeting = obj.get("gender_greeting").unwrap().as_object().unwrap();

        assert_eq!(
            greeting.get("message").unwrap(),
            "{gender, select, male {Mr.} female {Ms.} other {Dear}} {name}"
        );
    }

    #[test]
    fn test_crowdin_format_with_object_description() {
        // Test that format() handles object descriptions (serializes to JSON string)
        let mut messages = BTreeMap::new();
        messages.insert(
            "complex".to_string(),
            MessageDescriptor {
                id: Some("complex".to_string()),
                default_message: Some("Complex message".to_string()),
                description: Some(json!({"context": "header", "maxLength": 50})),
                file: None,
                start: None,
                end: None,
            },
        );

        let result = format(&messages);

        let obj = result.as_object().unwrap();
        let complex = obj.get("complex").unwrap().as_object().unwrap();

        assert_eq!(complex.get("message").unwrap(), "Complex message");
        // Object description should be serialized to JSON string
        let description = complex.get("description").unwrap().as_str().unwrap();
        assert!(description.contains("context"));
        assert!(description.contains("header"));
    }

    #[test]
    fn test_crowdin_format_empty_messages() {
        // Test that format() handles empty input
        let messages = BTreeMap::new();

        let result = format(&messages);

        assert!(result.is_object());
        assert!(result.as_object().unwrap().is_empty());
    }

    #[test]
    fn test_crowdin_format_without_default_message() {
        // Test that format() handles messages without defaultMessage
        let mut messages = BTreeMap::new();
        messages.insert(
            "no_message".to_string(),
            MessageDescriptor {
                id: Some("no_message".to_string()),
                default_message: None,
                description: Some(json!("This has no default message")),
                file: None,
                start: None,
                end: None,
            },
        );

        let result = format(&messages);

        let obj = result.as_object().unwrap();
        let entry = obj.get("no_message").unwrap().as_object().unwrap();

        // Should not have message field when defaultMessage is None
        assert!(entry.get("message").is_none());
        // Should still have description
        assert_eq!(
            entry.get("description").unwrap(),
            "This has no default message"
        );
    }

    // ==================== Round-trip Tests ====================

    #[test]
    fn test_crowdin_format_compile_roundtrip() {
        // Test that format() -> compile() produces the original messages
        let mut messages = BTreeMap::new();
        messages.insert(
            "greeting".to_string(),
            MessageDescriptor {
                id: Some("greeting".to_string()),
                default_message: Some("Hello {name}!".to_string()),
                description: Some(json!("Greeting")),
                file: None,
                start: None,
                end: None,
            },
        );
        messages.insert(
            "farewell".to_string(),
            MessageDescriptor {
                id: Some("farewell".to_string()),
                default_message: Some("Goodbye!".to_string()),
                description: Some(json!("Farewell")),
                file: None,
                start: None,
                end: None,
            },
        );

        // Format to Crowdin format
        let crowdin_json = format(&messages);

        // Compile back to simple format
        let compiled = compile(&crowdin_json);

        // Should have both messages with correct values
        assert_eq!(compiled.len(), 2);
        assert_eq!(compiled.get("greeting").unwrap(), "Hello {name}!");
        assert_eq!(compiled.get("farewell").unwrap(), "Goodbye!");
    }

    #[test]
    fn test_crowdin_format_json_structure() {
        // Test that the JSON structure matches Crowdin's expected format exactly
        let mut messages = BTreeMap::new();
        messages.insert(
            "test_message".to_string(),
            MessageDescriptor {
                id: Some("test_message".to_string()),
                default_message: Some("Test content".to_string()),
                description: Some(json!("Test description")),
                file: None,
                start: None,
                end: None,
            },
        );

        let result = format(&messages);

        // Convert to pretty JSON and verify structure
        let json_str = serde_json::to_string_pretty(&result).unwrap();

        // The output should match Crowdin's expected format:
        // {
        //   "test_message": {
        //     "message": "Test content",
        //     "description": "Test description"
        //   }
        // }
        let expected = json!({
            "test_message": {
                "message": "Test content",
                "description": "Test description"
            }
        });

        assert_eq!(result, expected);

        // Also verify JSON serialization format
        assert!(json_str.contains("\"message\""));
        assert!(json_str.contains("\"description\""));
        assert!(json_str.contains("\"Test content\""));
        assert!(json_str.contains("\"Test description\""));
    }
}
