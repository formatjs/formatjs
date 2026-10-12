use formatjs_cli::formatters::Formatter;
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

    let result = Formatter::Transifex.apply(&input, "messages.json").unwrap();
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

    let result = Formatter::Transifex.apply(&input, "messages.json").unwrap();
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

    let result = Formatter::Transifex.apply(&input, "messages.json").unwrap();
    assert_eq!(
        result.get("msg").unwrap(),
        "{count, plural, one {# item} other {# items}}"
    );
}
