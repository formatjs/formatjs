use anyhow::{Context, Result};
use serde_json::Value;
use std::collections::HashMap;

/// Transifex formatter: extracts string field from structured format
///
/// Input format:
/// ```json
/// {
///   "greeting": {
///     "string": "Hello {name}!",
///     "developer_comment": "Greeting message",
///     "context": "homepage",
///     "character_limit": "100"
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
        if let Some(obj) = value.as_object() {
            if let Some(string_field) = obj.get("string") {
                if let Some(msg_str) = string_field.as_str() {
                    results.insert(id.clone(), msg_str.to_string());
                } else {
                    eprintln!(
                        "Warning: 'string' field for '{}' in {} is not a string, skipping",
                        id, file_path
                    );
                }
            } else {
                eprintln!(
                    "Warning: Message '{}' in {} is missing 'string' field, skipping",
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
    fn test_transifex_formatter_basic() {
        let input = json!({
            "greeting": {
                "string": "Hello {name}!",
                "developer_comment": "Greeting message"
            },
            "farewell": {
                "string": "Goodbye!",
                "context": "homepage"
            }
        });

        let result = apply(&input, "test.json").unwrap();
        assert_eq!(result.len(), 2);
        assert_eq!(result.get("greeting").unwrap(), "Hello {name}!");
        assert_eq!(result.get("farewell").unwrap(), "Goodbye!");
    }

    #[test]
    fn test_transifex_formatter_missing_field() {
        let input = json!({
            "greeting": {
                "developer_comment": "Greeting message"
            }
        });

        let result = apply(&input, "test.json").unwrap();
        assert_eq!(result.len(), 0);
    }

    #[test]
    fn test_transifex_formatter_with_metadata() {
        let input = json!({
            "msg": {
                "string": "{count, plural, one {# item} other {# items}}",
                "developer_comment": "Item count",
                "context": "shopping cart",
                "character_limit": "50"
            }
        });

        let result = apply(&input, "test.json").unwrap();
        assert_eq!(
            result.get("msg").unwrap(),
            "{count, plural, one {# item} other {# items}}"
        );
    }
}
