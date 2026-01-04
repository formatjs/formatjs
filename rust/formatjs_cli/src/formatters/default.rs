use anyhow::{Context, Result};
use serde_json::Value;
use std::collections::HashMap;

/// Default formatter: extracts defaultMessage from MessageDescriptor objects
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
pub fn apply(json: &Value, file_path: &str) -> Result<HashMap<String, String>> {
    let mut results = HashMap::new();

    let map = json
        .as_object()
        .with_context(|| format!("Expected JSON object in file {}", file_path))?;

    for (id, value) in map {
        if let Some(obj) = value.as_object() {
            if let Some(default_msg) = obj.get("defaultMessage") {
                if let Some(msg_str) = default_msg.as_str() {
                    results.insert(id.clone(), msg_str.to_string());
                } else {
                    eprintln!(
                        "Warning: defaultMessage for '{}' in {} is not a string, skipping",
                        id, file_path
                    );
                }
            } else {
                eprintln!(
                    "Warning: Message '{}' in {} is missing 'defaultMessage' field, skipping",
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

        let result = apply(&input, "test.json").unwrap();
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

        let result = apply(&input, "test.json").unwrap();
        assert_eq!(result.len(), 0);
    }

    #[test]
    fn test_default_formatter_wrong_type() {
        let input = json!({
            "greeting": "Hello!"
        });

        let result = apply(&input, "test.json").unwrap();
        assert_eq!(result.len(), 0);
    }

    #[test]
    fn test_default_formatter_icu_message() {
        let input = json!({
            "msg": {
                "defaultMessage": "{count, plural, one {# item} other {# items}}"
            }
        });

        let result = apply(&input, "test.json").unwrap();
        assert_eq!(
            result.get("msg").unwrap(),
            "{count, plural, one {# item} other {# items}}"
        );
    }
}
