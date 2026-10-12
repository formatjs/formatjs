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
