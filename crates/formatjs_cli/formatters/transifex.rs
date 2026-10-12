use serde_json::{Value, json};
use std::collections::BTreeMap;

use crate::extractor::MessageDescriptor;

/// Transifex formatter: converts MessageDescriptor to {string, developer_comment} format
///
/// Format (extraction): Converts MessageDescriptor to Transifex format with string and developer_comment fields
/// Compile (translation): Extracts string field from Transifex format
///
/// Format output:
/// ```json
/// {
///   "greeting": {
///     "string": "Hello {name}!",
///     "developer_comment": "Greeting message"
///   }
/// }
/// ```
pub fn format(messages: &BTreeMap<String, MessageDescriptor>) -> Value {
    let mut results = serde_json::Map::new();

    for (id, msg) in messages {
        let mut entry = serde_json::Map::new();

        if let Some(default_message) = &msg.default_message {
            entry.insert("string".to_string(), json!(default_message));
        }

        if let Some(description) = &msg.description {
            let description_str = match description {
                Value::String(s) => s.clone(),
                other => serde_json::to_string(other).unwrap_or_default(),
            };
            entry.insert("developer_comment".to_string(), json!(description_str));
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
                if let Some(string_field) = obj.get("string") {
                    if let Some(msg_str) = string_field.as_str() {
                        results.insert(id.clone(), msg_str.to_string());
                    }
                }
            }
        }
    }

    results
}
