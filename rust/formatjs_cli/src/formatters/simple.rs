use anyhow::{Context, Result};
use serde_json::Value;
use std::collections::HashMap;

/// Simple formatter: pass-through for Record<string, string>
///
/// Input format:
/// ```json
/// {
///   "greeting": "Hello {name}!",
///   "farewell": "Goodbye!"
/// }
/// ```
///
/// Output: passes through unchanged
pub fn apply(json: &Value, file_path: &str) -> Result<HashMap<String, String>> {
    let mut results = HashMap::new();

    let map = json
        .as_object()
        .with_context(|| format!("Expected JSON object in file {}", file_path))?;

    for (id, value) in map {
        if let Some(msg_str) = value.as_str() {
            results.insert(id.clone(), msg_str.to_string());
        } else {
            eprintln!(
                "Warning: Message '{}' in {} is not a string, skipping",
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
    fn test_simple_formatter_basic() {
        let input = json!({
            "greeting": "Hello {name}!",
            "farewell": "Goodbye!"
        });

        let result = apply(&input, "test.json").unwrap();
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

        let result = apply(&input, "test.json").unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result.get("greeting").unwrap(), "Hello!");
        assert!(result.get("nested").is_none());
    }

    #[test]
    fn test_simple_formatter_icu_message() {
        let input = json!({
            "msg": "{count, plural, one {# item} other {# items}}"
        });

        let result = apply(&input, "test.json").unwrap();
        assert_eq!(
            result.get("msg").unwrap(),
            "{count, plural, one {# item} other {# items}}"
        );
    }
}
