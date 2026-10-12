use serde_json::{Value, json};
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
