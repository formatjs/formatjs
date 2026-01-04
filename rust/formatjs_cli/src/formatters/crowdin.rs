use anyhow::{Context, Result};
use serde_json::Value;
use std::collections::HashMap;

/// Crowdin formatter: extracts message field from structured format
///
/// Input format:
/// ```json
/// {
///   "greeting": {
///     "message": "Hello {name}!",
///     "description": "Greeting message"
///   }
/// }
/// ```
///
/// Output: `{"greeting": "Hello {name}!"}`
pub fn apply(json: &Value, file_path: &str) -> Result<HashMap<String, String>> {
    let mut results = HashMap::new();

    let map = json
        .as_object()
        .with_context(|| format!("Expected JSON object in file {}", file_path))?;

    for (id, value) in map {
        // Note: The TypeScript implementation has a check for "smartling" key
        // which seems like a copy-paste error, but we'll keep it for compatibility
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

        let result = apply(&input, "test.json").unwrap();
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

        let result = apply(&input, "test.json").unwrap();
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

        let result = apply(&input, "test.json").unwrap();
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

        let result = apply(&input, "test.json").unwrap();
        assert_eq!(
            result.get("msg").unwrap(),
            "{count, plural, one {# item} other {# items}}"
        );
    }
}
