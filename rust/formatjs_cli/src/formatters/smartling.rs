use anyhow::{Context, Result};
use serde_json::Value;
use std::collections::HashMap;

/// Smartling formatter: extracts message field and skips smartling metadata
///
/// Input format:
/// ```json
/// {
///   "smartling": {
///     "translate_paths": [{
///       "path": "*/message",
///       "key": "{*}/message",
///       "instruction": "*/description"
///     }],
///     "variants_enabled": true,
///     "string_format": "icu"
///   },
///   "greeting": {
///     "message": "Hello {name}!",
///     "description": "Greeting message"
///   }
/// }
/// ```
///
/// Output: `{"greeting": "Hello {name}!"}` (skips "smartling" key)
pub fn apply(json: &Value, file_path: &str) -> Result<HashMap<String, String>> {
    let mut results = HashMap::new();

    let map = json
        .as_object()
        .with_context(|| format!("Expected JSON object in file {}", file_path))?;

    for (id, value) in map {
        // Skip the smartling metadata key
        if id == "smartling" {
            continue;
        }

        if let Some(obj) = value.as_object() {
            if let Some(message_field) = obj.get("message") {
                if let Some(msg_str) = message_field.as_str() {
                    results.insert(id.clone(), msg_str.to_string());
                } else {
                    eprintln!(
                        "Warning: 'message' field for '{}' in {} is not a string, skipping",
                        id, file_path
                    );
                }
            } else {
                eprintln!(
                    "Warning: Message '{}' in {} is missing 'message' field, skipping",
                    id, file_path
                );
            }
        } else {
            eprintln!(
                "Warning: Message '{}' in {} is not an object, skipping",
                id, file_path
            );
        }
    }

    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_smartling_formatter_basic() {
        let input = json!({
            "smartling": {
                "translate_paths": [{
                    "path": "*/message",
                    "key": "{*}/message",
                    "instruction": "*/description"
                }],
                "variants_enabled": true,
                "string_format": "icu"
            },
            "greeting": {
                "message": "Hello {name}!",
                "description": "Greeting message"
            },
            "farewell": {
                "message": "Goodbye!"
            }
        });

        let result = apply(&input, "test.json").unwrap();
        assert_eq!(result.len(), 2);
        assert_eq!(result.get("greeting").unwrap(), "Hello {name}!");
        assert_eq!(result.get("farewell").unwrap(), "Goodbye!");
        assert!(result.get("smartling").is_none());
    }

    #[test]
    fn test_smartling_formatter_skips_metadata() {
        let input = json!({
            "smartling": {
                "string_format": "icu"
            },
            "msg": {
                "message": "Test message"
            }
        });

        let result = apply(&input, "test.json").unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result.get("msg").unwrap(), "Test message");
        assert!(result.get("smartling").is_none());
    }

    #[test]
    fn test_smartling_formatter_missing_field() {
        let input = json!({
            "greeting": {
                "description": "Greeting message"
            }
        });

        let result = apply(&input, "test.json").unwrap();
        assert_eq!(result.len(), 0);
    }
}
