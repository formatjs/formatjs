use formatjs_cli::formatters::Formatter;
use serde_json::json;

#[test]
fn test_simple_formatter_basic() {
    let input = json!({
        "greeting": "Hello {name}!",
        "farewell": "Goodbye!"
    });

    let result = Formatter::Simple.apply(&input, "messages.json").unwrap();
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

    let result = Formatter::Simple.apply(&input, "messages.json").unwrap();
    assert_eq!(result.len(), 1);
    assert_eq!(result.get("greeting").unwrap(), "Hello!");
    assert!(result.get("nested").is_none());
}

#[test]
fn test_simple_formatter_icu_message() {
    let input = json!({
        "msg": "{count, plural, one {# item} other {# items}}"
    });

    let result = Formatter::Simple.apply(&input, "messages.json").unwrap();
    assert_eq!(
        result.get("msg").unwrap(),
        "{count, plural, one {# item} other {# items}}"
    );
}
