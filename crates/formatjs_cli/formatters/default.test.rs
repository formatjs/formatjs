use formatjs_cli::formatters::Formatter;
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

    let result = Formatter::Default.apply(&input, "messages.json").unwrap();
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

    let result = Formatter::Default.apply(&input, "messages.json").unwrap();
    assert_eq!(result.len(), 0);
}

#[test]
fn test_default_formatter_wrong_type() {
    let input = json!({
        "greeting": "Hello!"
    });

    let result = Formatter::Default.apply(&input, "messages.json").unwrap();
    assert_eq!(result.len(), 0);
}

#[test]
fn test_default_formatter_icu_message() {
    let input = json!({
        "msg": {
            "defaultMessage": "{count, plural, one {# item} other {# items}}"
        }
    });

    let result = Formatter::Default.apply(&input, "messages.json").unwrap();
    assert_eq!(
        result.get("msg").unwrap(),
        "{count, plural, one {# item} other {# items}}"
    );
}
