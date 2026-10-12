use formatjs_cli::formatters::Formatter;
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

    let result = Formatter::Smartling.apply(&input, "messages.json").unwrap();
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

    let result = Formatter::Smartling.apply(&input, "messages.json").unwrap();
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

    let result = Formatter::Smartling.apply(&input, "messages.json").unwrap();
    assert_eq!(result.len(), 0);
}
